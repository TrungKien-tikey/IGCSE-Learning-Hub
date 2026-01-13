package com.igcse.ai.service.ass.phanTich;

import com.igcse.ai.service.common.ILanguageService;
import com.igcse.ai.service.common.JsonService;
import com.igcse.ai.dto.phanTich.AIInsightDTO;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.repository.AIResultRepository;
import com.igcse.ai.entity.AIInsight;
import com.igcse.ai.repository.AIInsightRepository;
import com.igcse.ai.service.common.TierManagerService;
import com.igcse.ai.service.llm.InsightAiService;
import com.fasterxml.jackson.core.type.TypeReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InsightService implements IInsightService {

    private static final Logger logger = LoggerFactory.getLogger(InsightService.class);

    private final AIInsightRepository aiInsightRepository;
    private final AIResultRepository aiResultRepository;
    private final JsonService jsonService;
    private final ILanguageService languageService;
    private final TierManagerService tierManagerService;
    private final InsightAiService insightAiService;

    public InsightService(AIResultRepository aiResultRepository,
            InsightAiService insightAiService,
            JsonService jsonService,
            ILanguageService languageService,
            AIInsightRepository aiInsightRepository,
            TierManagerService tierManagerService) {
        this.aiResultRepository = aiResultRepository;
        this.insightAiService = insightAiService;
        this.jsonService = jsonService;
        this.languageService = languageService;
        this.aiInsightRepository = aiInsightRepository;
        this.tierManagerService = tierManagerService;
    }

    /**
     * Lấy nhận xét AI tổng hợp cho học sinh (Dùng cho Dashboard).
     * 
     * @param studentId ID học sinh
     * @return DTO chứa nhận xét, điểm mạnh, điểm yếu và kế hoạch hành động.
     */
    @Override
    @Transactional
    public AIInsightDTO getInsight(Long studentId) {
        return getInsight(studentId, null);
    }

    /**
     * Lấy nhận xét AI có kèm dữ liệu làm giàu từ NiFi (Tên học sinh, Persona).
     * 
     * @param studentId ID học sinh
     * @param nifiData  Chuỗi JSON chứa thông tin bổ sung từ luồng NiFi
     * @return DTO chứa nhận xét đã được cá nhân hóa
     */
    @Override
    public AIInsightDTO getInsight(Long studentId, String nifiData) {
        logger.info("Processing insights for studentId: {} with nifiData enrichment", studentId);
        Objects.requireNonNull(studentId, "Student ID cannot be null");

        // ✅ BƯỚC 1: Lấy dữ liệu bài thi
        List<AIResult> results = aiResultRepository.findByStudentId(studentId);
        if (results.isEmpty()) {
            return createEmptyInsight(studentId);
        }

        // Bước 1: Parse và phân tích logic (Dùng chung cho cả AI và Cache)
        TierManagerService.AnalysisData analysis = tierManagerService.analyzeResults(results);

        // ✅ BƯỚC 2: Kiểm tra dữ liệu mới
        boolean isNewData = tierManagerService.isNewData(studentId, analysis);

        // Nếu dữ liệu không đổi, trả về bản ghi AI mới nhất
        if (!isNewData) {
            return aiInsightRepository.findTopByStudentIdOrderByGeneratedAtDesc(studentId)
                    .map(this::convertToDTO)
                    .orElseGet(() -> createEmptyInsight(studentId));
        }

        // ✅ BƯỚC 3: Kích hoạt AI Synthesis (Gộp bài có bối cảnh)
        logger.info("Triggering AI Synthesis with Context for studentId: {}", studentId);
        AIInsightDTO synthesisResult = null;

        try {
            // Lấy các bản phân tích cũ làm ngữ cảnh so sánh
            List<AIInsight> recentLogics = aiInsightRepository
                    .findTop5ByStudentIdOrderByGeneratedAtDesc(studentId);

            String logContext = recentLogics.stream()
                    .limit(3)
                    .map(AIInsight::getOverallSummary)
                    .collect(Collectors.joining("\n---\n"));

            // Lấy bản AI chuyên sâu gần nhất làm bối cảnh so sánh (Context)
            String aiContext = aiInsightRepository
                    .findTopByStudentIdAndIsAiGeneratedTrueOrderByGeneratedAtDesc(studentId)
                    .map(AIInsight::getOverallSummary)
                    .orElse("Đây là lần đầu tiên học sinh được phân tích chuyên sâu.");

            String dataSummary = "Dữ liệu mới: " + tierManagerService.buildTextSummary(analysis) +
                    "\n\n--- CÁC PHÂN TÍCH LOGIC GẦN ĐÂY ---\n" + logContext +
                    "\n\n--- BỐI CẢNH PHÂN TÍCH CHUYÊN SÂU TRƯỚC ĐÓ ---\n" + aiContext +
                    "\n\nHãy so sánh sự tiến bộ dựa trên bối cảnh cũ và các mẩu phân tích mới để đưa ra đánh giá đúc kết sâu sắc.";

            String aiLanguageName = languageService.getAiLanguageName("vi");
            synthesisResult = insightAiService.generateInsight(dataSummary, aiLanguageName);

            if (synthesisResult != null) {
                synthesisResult.setStudentId(studentId);
                // Lưu kết quả AI kèm snapshot dữ liệu
                AIInsight aiEntity = saveInsightToCacheInternal(synthesisResult, true, analysis);

                return convertToDTO(aiEntity);
            }
        } catch (Exception e) {
            logger.error("AI Synthesis failed for student {}: {}", studentId, e.getMessage());
        }

        return createEmptyInsight(studentId);
    }

    /**
     * Lưu kết quả phân tích AI vào cơ sở dữ liệu làm cache.
     */
    private AIInsight saveInsightToCacheInternal(AIInsightDTO dto, boolean isAiGenerated,
            TierManagerService.AnalysisData analysis) {
        AIInsight entity = new AIInsight();
        entity.setStudentId(dto.getStudentId());
        entity.setOverallSummary(dto.getOverallSummary());
        entity.setActionPlan(dto.getActionPlan());
        entity.setIsAiGenerated(isAiGenerated);
        entity.setGeneratedAt(new Date());

        // Lưu snapshot dữ liệu bài thi được dùng để phân tích
        if (analysis != null) {
            entity.setTotalExamsAnalyzed(analysis.totalExams());
            entity.setAvgScoreAnalyzed(analysis.avgScore());
        }

        try {
            if (dto.getKeyStrengths() != null)
                entity.setKeyStrengths(jsonService.toJson(dto.getKeyStrengths()));
            if (dto.getAreasForImprovement() != null)
                entity.setAreasForImprovement(jsonService.toJson(dto.getAreasForImprovement()));
        } catch (Exception e) {
            logger.error("Error serializing JSON for synthesis", e);
        }

        return aiInsightRepository.save(entity);
    }

    /**
     * Lấy nhận xét AI riêng lẻ cho từng lần làm bài (Dùng trong xem chi tiết kết
     * quả).
     * 
     * @param attemptId ID lượt làm bài
     */
    @Override
    public AIInsightDTO getInsightByAttempt(Long attemptId) {
        logger.info("Processing insight for attemptId: {}", attemptId);

        Optional<AIResult> resultOpt = aiResultRepository.findByAttemptId(attemptId);
        if (resultOpt.isEmpty()) {
            // Return empty or error? plan implies we show it in UI.
            // If no result, maybe not graded yet?
            return null;
        }

        AIResult result = resultOpt.get();
        Long studentId = result.getStudentId();

        // Use the single result to build analysis data
        TierManagerService.AnalysisData analysis = tierManagerService.analyzeResults(Collections.singletonList(result));

        AIInsightDTO insight = null;

        try {
            String dataSummary = tierManagerService.buildTextSummary(analysis);
            // Append explicit attempt info
            dataSummary += " Đây là kết quả của một bài thi cụ thể (Attempt ID: " + attemptId + ").";

            String aiLanguageName = languageService.getAiLanguageName("vi");
            insight = insightAiService.generateInsight(dataSummary, aiLanguageName);

            if (insight != null) {
                insight.setStudentId(studentId);
            }

        } catch (Exception e) {
            logger.warn("AI service failed for attempt {}: {}", attemptId, e.getMessage());
        }

        if (insight == null) {
            insight = createEmptyInsight(studentId);
        }

        return insight;
    }

    /**
     * Chuyển đổi dữ liệu từ Entity (DB) sang DTO (Frontend) và xử lý JSON.
     */
    private AIInsightDTO convertToDTO(AIInsight entity) {
        AIInsightDTO dto = new AIInsightDTO();
        dto.setStudentId(entity.getStudentId());
        dto.setOverallSummary(entity.getOverallSummary());
        dto.setActionPlan(entity.getActionPlan());

        // Parse JSON arrays
        try {
            if (entity.getKeyStrengths() != null && !entity.getKeyStrengths().isEmpty()) {
                List<String> strengths = jsonService.getObjectMapper().readValue(
                        entity.getKeyStrengths(),
                        new TypeReference<List<String>>() {
                        });
                dto.setKeyStrengths(strengths);
            }

            if (entity.getAreasForImprovement() != null && !entity.getAreasForImprovement().isEmpty()) {
                List<String> improvements = jsonService.getObjectMapper().readValue(
                        entity.getAreasForImprovement(),
                        new TypeReference<List<String>>() {
                        });
                dto.setAreasForImprovement(improvements);
            }
        } catch (Exception e) {
            logger.error("Error parsing JSON in cached insight", e);
            dto.setKeyStrengths(new ArrayList<>());
            dto.setAreasForImprovement(new ArrayList<>());
        }

        return dto;
    }

    /**
     * Tạo đối tượng nhận xét rỗng khi chưa có dữ liệu bài thi.
     */
    private AIInsightDTO createEmptyInsight(Long studentId) {
        AIInsightDTO insight = new AIInsightDTO();
        insight.setStudentId(studentId);
        insight.setOverallSummary("Chưa có dữ liệu để phân tích.");
        insight.setKeyStrengths(new ArrayList<>());
        insight.setAreasForImprovement(new ArrayList<>());
        insight.setActionPlan("Vui lòng hoàn thành bài thi để nhận được insights.");
        return insight;
    }
}
