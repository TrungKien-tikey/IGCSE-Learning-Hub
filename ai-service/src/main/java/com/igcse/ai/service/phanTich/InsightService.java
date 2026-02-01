package com.igcse.ai.service.phanTich;

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

    @Override
    @Transactional
    public AIInsightDTO getInsight(Long studentId) {

        logger.info("Getting insights for studentId: {}", studentId);
        Objects.requireNonNull(studentId, "Student ID cannot be null");

        Optional<AIInsight> cached = aiInsightRepository.findTopByStudentIdOrderByGeneratedAtDesc(studentId);

        // Có cache AI insight -> kiểm tra xem có cần update không
        if (cached.isPresent()) {
            List<AIResult> results = aiResultRepository.findByStudentId(studentId);

            // OPTIMIZATION: Nếu chưa có bài thi nhưng đã có insight AI -> trả về insight đã
            // có
            if (results.isEmpty()) {
                logger.info("Student {} has no exam results but has cached AI insight. Returning cache.", studentId);
                return convertToDTO(cached.get());
            }

            TierManagerService.AnalysisData analysis = tierManagerService.analyzeResults(results);
            boolean isNewData = tierManagerService.isNewDataForInsight(studentId, analysis);

            if (!isNewData) {
                logger.info("Returning latest cached insight for studentId: {}", studentId);
                return convertToDTO(cached.get());
            }
        } else {
            // Chưa có cache và chưa có bài thi -> trả về empty
            List<AIResult> results = aiResultRepository.findByStudentId(studentId);
            if (results.isEmpty()) {
                return createEmptyInsight(studentId);
            }
        }

        // Không có cache hoặc có dữ liệu mới: làm tươi lại bằng luồng chuẩn
        return refreshInsight(studentId, null);
    }

    @Override
    public void triggerUpdate(Long studentId, String nifiData) {
        logger.info("Triggering insight update for studentId: {} with data size: {}",
                studentId, (nifiData != null ? nifiData.length() : "null"));
        refreshInsight(studentId, nifiData);
    }

    @Transactional
    private AIInsightDTO refreshInsight(Long studentId, String nifiData) {
        List<AIResult> results = aiResultRepository.findByStudentId(studentId);
        if (results.isEmpty()) {
            return createEmptyInsight(studentId);
        }

        TierManagerService.AnalysisData analysis = tierManagerService.analyzeResults(results);

        boolean isNewData = tierManagerService.isNewDataForInsight(studentId, analysis);

        // Nếu dữ liệu không đổi, trả về bản ghi cũ nhất
        if (!isNewData) {
            return aiInsightRepository.findTopByStudentIdOrderByGeneratedAtDesc(studentId)
                    .map(this::convertToDTO)
                    .orElseGet(() -> createEmptyInsight(studentId));
        }

        logger.info("Triggering AI Synthesis with Context for studentId: {}", studentId);

        // Khóa để tránh xử lý song song cho cùng 1 học sinh
        if (!tierManagerService.startProcessing(studentId)) {
            logger.warn("Insight analysis already in progress for student: {}. Skipping.", studentId);
            return aiInsightRepository.findTopByStudentIdOrderByGeneratedAtDesc(studentId)
                    .map(this::convertToDTO)
                    .orElseGet(() -> createEmptyInsight(studentId));
        }

        try {
            TierManagerService.AnalysisMetadata metadata = tierManagerService.extractMetadata(studentId, nifiData,
                    null);

            // Lấy các bản phân tích cũ làm ngữ cảnh so sánh
            List<AIInsight> recentLogics = aiInsightRepository
                    .findTop5ByStudentIdOrderByGeneratedAtDesc(studentId);

            String logContext = recentLogics.stream()
                    .limit(3)
                    .map(AIInsight::getOverallSummary)
                    .filter(Objects::nonNull)
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
            AIInsightDTO synthesisResult = null;
            try {
                synthesisResult = insightAiService.generateInsight(dataSummary, metadata.studentName(),
                        metadata.personaInfo(), aiLanguageName);
            } catch (Exception e) {
                logger.error("LLM Call failed for insight synthesis: {}", e.getMessage());
            }

            if (synthesisResult != null) {
                synthesisResult.setStudentId(studentId);
                // Lưu kết quả AI kèm snapshot dữ liệu
                AIInsight aiEntity = saveInsightToCacheInternal(synthesisResult, true, analysis, metadata);

                return convertToDTO(aiEntity);
            }
        } catch (Exception e) {
            logger.error("AI Synthesis failed for student {}: {}", studentId, e.getMessage());
        } finally {
            tierManagerService.stopProcessing(studentId);
        }

        return createEmptyInsight(studentId);
    }

    /**
     * Lưu kết quả phân tích AI vào cơ sở dữ liệu làm cache.
     */
    private AIInsight saveInsightToCacheInternal(AIInsightDTO dto, boolean isAiGenerated,
            TierManagerService.AnalysisData analysis, TierManagerService.AnalysisMetadata metadata) {
        AIInsight entity = new AIInsight();
        entity.setStudentId(dto.getStudentId());
        entity.setOverallSummary(dto.getOverallSummary());
        entity.setActionPlan(dto.getActionPlan());
        entity.setIsAiGenerated(isAiGenerated);
        entity.setGeneratedAt(new Date());

        // Lưu Metadata
        if (metadata != null) {
            entity.setStudentName(metadata.studentName());
        }

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
     * OPTIMIZATION: Ưu tiên trả về insight đã cache trong AIResult.aiInsightText
     * để tránh gọi LLM mỗi lần user xem chi tiết bài thi.
     * 
     * @param attemptId ID lượt làm bài
     */
    @Override
    public AIInsightDTO getInsightByAttempt(Long attemptId) {
        logger.info("Processing insight for attemptId: {}", attemptId);

        Optional<AIResult> resultOpt = aiResultRepository.findByAttemptId(attemptId);
        if (resultOpt.isEmpty()) {
            return null;
        }

        AIResult result = resultOpt.get();
        Long studentId = result.getStudentId();

        // 1. CACHE HIT: Kiểm tra nếu đã có insight được cache trong AIResult
        if (result.getAiInsightText() != null && !result.getAiInsightText().isEmpty()) {
            logger.debug("Cache HIT for attempt insight: {}", attemptId);
            AIInsightDTO cachedInsight = new AIInsightDTO();
            cachedInsight.setStudentId(studentId);
            cachedInsight.setOverallSummary(result.getAiInsightText());
            cachedInsight.setKeyStrengths(Collections.emptyList());
            cachedInsight.setAreasForImprovement(Collections.emptyList());
            cachedInsight.setActionPlan("Xem phần nhận xét chi tiết ở trên.");
            return cachedInsight;
        }

        // 2. CACHE MISS: Gọi LLM và lưu kết quả vào cache
        logger.debug("Cache MISS for attempt insight: {}. Calling LLM...", attemptId);
        TierManagerService.AnalysisData analysis = tierManagerService.analyzeResults(Collections.singletonList(result));
        AIInsightDTO insight = null;

        try {
            String dataSummary = tierManagerService.buildTextSummary(analysis);
            dataSummary += " Đây là kết quả của một bài thi cụ thể (Attempt ID: " + attemptId + ").";

            TierManagerService.AnalysisMetadata metadata = tierManagerService.extractMetadata(studentId, null, null);
            String aiLanguageName = languageService.getAiLanguageName("vi");
            try {
                insight = insightAiService.generateInsight(dataSummary, metadata.studentName(),
                        metadata.personaInfo(), aiLanguageName);
            } catch (Exception e) {
                logger.error("LLM Call failed for attempt insight synthesis (AttemptId: {}): {}", attemptId,
                        e.getMessage());
            }

            if (insight != null) {
                insight.setStudentId(studentId);

                // Lưu insight vào cache trong AIResult
                result.setAiInsightText(insight.getOverallSummary());
                aiResultRepository.save(result);
                logger.info("Cached AI insight for attemptId: {}", attemptId);
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

        // Đảm bảo các List không bao giờ null
        dto.setKeyStrengths(new ArrayList<>());
        dto.setAreasForImprovement(new ArrayList<>());

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
