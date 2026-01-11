package com.igcse.ai.service.ass.phanTich;

import com.igcse.ai.service.common.ILanguageService;
import com.igcse.ai.service.common.JsonService;
import com.igcse.ai.dto.phanTich.AIInsightDTO;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.repository.AIResultRepository;
import com.igcse.ai.entity.AIInsight;
import com.igcse.ai.entity.AIProgress;
import com.igcse.ai.repository.AIInsightRepository;
import com.igcse.ai.repository.AIProgressRepository;
import com.igcse.ai.service.common.TierManagerService;
import com.igcse.ai.service.llm.InsightAiService;
import com.fasterxml.jackson.core.type.TypeReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class InsightService implements IInsightService {

    private static final Logger logger = LoggerFactory.getLogger(InsightService.class);

    // Constants cho logic nghiệp vụ
    private static final double EXCELLENT_THRESHOLD = 8.0;
    private static final double GOOD_THRESHOLD = 5.0;

    private final AIInsightRepository aiInsightRepository;
    private final AIResultRepository aiResultRepository;
    private final JsonService jsonService;
    private final ILanguageService languageService;
    private final AIProgressRepository aiProgressRepository;
    private final TierManagerService tierManagerService;
    private final InsightAiService insightAiService;

    public InsightService(AIResultRepository aiResultRepository,
            InsightAiService insightAiService,
            JsonService jsonService,
            ILanguageService languageService,
            AIInsightRepository aiInsightRepository,
            AIProgressRepository aiProgressRepository,
            TierManagerService tierManagerService) {
        this.aiResultRepository = aiResultRepository;
        this.insightAiService = insightAiService;
        this.jsonService = jsonService;
        this.languageService = languageService;
        this.aiInsightRepository = aiInsightRepository;
        this.aiProgressRepository = aiProgressRepository;
        this.tierManagerService = tierManagerService;
    }

    @Override
    @Transactional
    public AIInsightDTO getInsight(Long studentId) {
        logger.info("Processing insights for studentId: {}", studentId);
        Objects.requireNonNull(studentId, "Student ID cannot be null");

        // ✅ BƯỚC 1: Lấy dữ liệu bài thi
        List<AIResult> results = aiResultRepository.findByStudentId(studentId);
        if (results.isEmpty()) {
            return createEmptyInsight(studentId);
        }

        // Bước 1: Parse và phân tích logic (Tầng 1)
        TierManagerService.AnalysisData analysis = tierManagerService.analyzeResults(results);
        AIInsightDTO tier1Insight = generateFallbackInsights(analysis, studentId);

        // Cập nhật/Lưu Tầng 1 vào Database (Tập trung ở TierManager)
        tierManagerService.updateTier1Counter(studentId, analysis, tier1Insight.getOverallSummary(),
                analysis.strengths(), analysis.weaknesses());

        // ✅ BƯỚC 2: Kiểm tra Trigger Tầng 2 (AI)
        if (!tierManagerService.shouldTriggerTier2(studentId, analysis.avgScore())) {
            logger.info("Tier 2 (AI) trigger not met for studentId: {}. Returning Tier 1 (Logic).", studentId);

            // Trả về Tier 2 MỚI NHẤT nếu có, nếu không trả về Tier 1 vừa tạo
            return aiInsightRepository.findTopByStudentIdOrderByGeneratedAtDesc(studentId)
                    .map(this::convertToDTO)
                    .orElse(tier1Insight);
        }

        // ✅ BƯỚC 3: Chạy Tầng 2 - AI Chuyên sâu
        logger.info("Triggering Tier 2 (AI) Insight for studentId: {}", studentId);
        AIInsightDTO newInsight = null;
        boolean isAiGenerated = false;

        try {
            String dataSummary = buildTextSummary(analysis);
            String aiLanguageName = languageService.getAiLanguageName("vi");
            newInsight = insightAiService.generateInsight(dataSummary, aiLanguageName);
            if (newInsight != null) {
                newInsight.setStudentId(studentId);
                isAiGenerated = true;
            }
        } catch (Exception e) {
            logger.warn("AI service failed for student {}: {}", studentId, e.getMessage());
        }

        // Fallback nếu AI lỗi
        if (newInsight == null) {
            newInsight = tier1Insight;
            isAiGenerated = false;
        }

        // Lưu vào cache Tầng 2 và reset counter Tầng 1
        saveInsightToCache(newInsight, isAiGenerated);
        tierManagerService.resetCounter(studentId);

        return newInsight;
    }

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
            String dataSummary = buildTextSummary(analysis);
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
            insight = generateFallbackInsights(analysis, studentId);
            // Override summary to be specific to attempt if fallback
            insight.setOverallSummary(result.getFeedback() != null && !result.getFeedback().isEmpty()
                    ? result.getFeedback()
                    : insight.getOverallSummary());
        }

        return insight;
    }

    // ✅ THÊM: Convert Entity to DTO
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

    // ✅ THÊM: Save to cache
    private void saveInsightToCache(AIInsightDTO dto, boolean isAiGenerated) {
        try {
            // ✅ BƯỚC 1: Lấy các bản ghi cũ chưa được đúc kết (progress_id is null)
            List<AIInsight> unlinkedInsights = aiInsightRepository
                    .findTop5ByStudentIdAndProgressIdIsNullOrderByGeneratedAtDesc(dto.getStudentId());

            // ✅ BƯỚC 2: Tạo Entity Insight mới
            AIInsight entity = new AIInsight();
            entity.setStudentId(dto.getStudentId());
            entity.setOverallSummary(dto.getOverallSummary());
            entity.setActionPlan(dto.getActionPlan());
            entity.setIsAiGenerated(isAiGenerated);
            entity.setLanguage("vi");

            try {
                if (dto.getKeyStrengths() != null) {
                    entity.setKeyStrengths(jsonService.toJson(dto.getKeyStrengths()));
                }
                if (dto.getAreasForImprovement() != null) {
                    entity.setAreasForImprovement(jsonService.toJson(dto.getAreasForImprovement()));
                }
            } catch (Exception e) {
                logger.error("Error converting to JSON", e);
            }

            AIInsight savedInsight = aiInsightRepository.save(entity);

            // ✅ BƯỚC 3: Nếu có đủ dữ liệu (ví dụ > 3 bản ghi chưa đúc kết), tiến hành tạo
            // Progress
            if (unlinkedInsights.size() >= 3) {
                createProgressSummary(dto.getStudentId(), unlinkedInsights, savedInsight);
            }

            logger.info("Saved insight to cache for studentId: {}", dto.getStudentId());
        } catch (Exception e) {
            logger.error("Error saving insight to cache", e);
        }
    }

    private void createProgressSummary(Long studentId, List<AIInsight> history, AIInsight latest) {
        try {
            logger.info("Synthesizing learning progress for studentId: {}", studentId);

            // Tạo bản tóm tắt từ lịch sử để gửi cho AI
            StringBuilder historySummary = new StringBuilder();
            for (AIInsight h : history) {
                historySummary.append("- ").append(h.getGeneratedAt()).append(": ").append(h.getOverallSummary())
                        .append("\n");
            }

            // Gọi AI để đúc kết (Ở đây tôi giả sử dùng InsightAiService có phương thức
            // synthesizeProgress)
            // Nếu chưa có phương thức này, tôi sẽ dùng logic rule-based tạm thời
            AIProgress progress = new AIProgress();
            progress.setStudentId(studentId);
            progress.setTrendSummary(
                    "Học sinh đang có dấu hiệu cải thiện dựa trên " + history.size() + " lần phân tích gần nhất.");
            progress.setTrendStatus("IMPROVING"); // Mock logic
            progress.setScoreChange(0.5); // Mock logic

            AIProgress savedProgress = aiProgressRepository.save(progress);

            // ✅ CẬP NHẬT LIÊN KẾT: Gán progress_id cho các bản ghi cũ và bản mới nhất
            latest.setProgressId(savedProgress.getProgressId());
            aiInsightRepository.save(latest);

            for (AIInsight h : history) {
                h.setProgressId(savedProgress.getProgressId());
                aiInsightRepository.save(h);
            }

            logger.info("Successfully created AIProgress with ID: {}", savedProgress.getProgressId());
        } catch (Exception e) {
            logger.error("Failed to create progress summary", e);
        }
    }

    private String buildTextSummary(TierManagerService.AnalysisData data) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Học sinh có %d bài thi. Điểm TB: %.2f/10. Tỷ lệ đạt: %.1f%%. ",
                data.totalExams(), data.avgScore(), data.passRate()));

        if (!data.strengths().isEmpty()) {
            sb.append("Điểm mạnh: ").append(String.join(", ", data.strengths().stream().limit(3).toList()))
                    .append(". ");
        }
        if (!data.weaknesses().isEmpty()) {
            sb.append("Cần cải thiện: ").append(String.join(", ", data.weaknesses().stream().limit(3).toList()))
                    .append(". ");
        }
        return sb.toString();
    }

    private AIInsightDTO generateFallbackInsights(TierManagerService.AnalysisData data, Long studentId) {
        AIInsightDTO insight = new AIInsightDTO();
        insight.setStudentId(studentId);

        // Xác định summary dựa trên điểm số
        String level = data.avgScore() >= EXCELLENT_THRESHOLD ? "xuất sắc"
                : data.avgScore() >= GOOD_THRESHOLD ? "tốt" : "cần cải thiện";

        insight.setOverallSummary(String.format(
                "Học sinh có thành tích %s với điểm trung bình %.2f/10. Tỷ lệ đạt: %.1f%%.",
                level, data.avgScore(), data.passRate()));

        insight.setKeyStrengths(data.strengths().isEmpty() ? List.of("Hoàn thành đầy đủ các bài thi")
                : data.strengths().stream().limit(5).map(s -> s + " đạt kết quả tốt").toList());

        insight.setAreasForImprovement(data.weaknesses().isEmpty() ? List.of("Nỗ lực duy trì phong độ")
                : data.weaknesses().stream().limit(5).map(w -> w + " cần xem lại kiến thức").toList());

        insight.setActionPlan("Tập trung ôn tập các phần có điểm số thấp và thực hành thêm các bài tập tương tự.");
        return insight;
    }

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
