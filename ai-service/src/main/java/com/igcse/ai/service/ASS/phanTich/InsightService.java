package com.igcse.ai.service.ass.phanTich;

import com.igcse.ai.service.common.ILanguageService;
import com.igcse.ai.service.common.JsonService;
import com.igcse.ai.dto.aiChamDiem.GradingResult;
import com.igcse.ai.dto.phanTich.AIInsightDTO;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.repository.AIResultRepository;
import com.igcse.ai.service.llm.InsightAiService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InsightService implements IInsightService {

    private static final Logger logger = LoggerFactory.getLogger(InsightService.class);

    // Constants cho logic nghiệp vụ
    private static final double EXCELLENT_THRESHOLD = 8.0;
    private static final double GOOD_THRESHOLD = 5.0;
    private static final double STRENGTH_PERCENTAGE = 80.0;
    private static final double WEAKNESS_PERCENTAGE = 50.0;

    private final AIResultRepository aiResultRepository;
    private final JsonService jsonService;
    private final ILanguageService languageService;
    private final InsightAiService insightAiService;

    public InsightService(AIResultRepository aiResultRepository,
            InsightAiService insightAiService,
            JsonService jsonService,
            ILanguageService languageService) {
        this.aiResultRepository = aiResultRepository;
        this.insightAiService = insightAiService;
        this.jsonService = jsonService;
        this.languageService = languageService;
    }

    @Override
    public AIInsightDTO getInsight(Long studentId) {
        logger.info("Processing insights for studentId: {}", studentId);
        Objects.requireNonNull(studentId, "Student ID cannot be null");

        List<AIResult> results = aiResultRepository.findByStudentId(studentId);
        if (results.isEmpty()) {
            return createEmptyInsight(studentId);
        }

        // Bước 1: Parse và tiền xử lý dữ liệu 1 lần duy nhất
        AnalysisData analysis = analyzeStudentData(results);

        // Bước 2: Thử dùng AI
        try {
            String dataSummary = buildTextSummary(analysis);
            String aiLanguageName = languageService.getAiLanguageName("vi");
            AIInsightDTO aiInsight = insightAiService.generateInsight(dataSummary, aiLanguageName);
            if (aiInsight != null) {
                aiInsight.setStudentId(studentId);
                return aiInsight;
            }
        } catch (Exception e) {
            logger.warn("AI service failed for student {}: {}", studentId, e.getMessage());
        }

        // Bước 3: Fallback logic (Sử dụng dữ liệu đã phân tích ở Bước 1)
        return generateFallbackInsights(analysis, studentId);
    }

    /**
     * Lớp nội bộ để chứa dữ liệu đã phân tích
     */
    private record AnalysisData(
            double avgScore,
            double passRate,
            int totalExams,
            List<String> strengths,
            List<String> weaknesses) {
    }

    private AnalysisData analyzeStudentData(List<AIResult> results) {
        double avgScore = results.stream()
                .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0.0)
                .average().orElse(0.0);

        long passedCount = results.stream().filter(AIResult::isPassed).count();
        double passRate = (double) passedCount / results.size() * 100;

        List<String> strengths = new ArrayList<>();
        List<String> weaknesses = new ArrayList<>();

        for (AIResult result : results) {
            List<GradingResult> details = jsonService.parseGradingDetails(result.getDetails());
            for (GradingResult gr : details) {
                if (gr.getScore() != null && gr.getMaxScore() != null && gr.getMaxScore() > 0) {
                    double percentage = (gr.getScore() / gr.getMaxScore()) * 100;
                    if (percentage >= STRENGTH_PERCENTAGE) {
                        strengths.add("Câu " + gr.getQuestionId());
                    } else if (percentage < WEAKNESS_PERCENTAGE) {
                        weaknesses.add("Câu " + gr.getQuestionId());
                    }
                }
            }
        }

        return new AnalysisData(
                avgScore,
                passRate,
                results.size(),
                strengths.stream().distinct().collect(Collectors.toList()),
                weaknesses.stream().distinct().collect(Collectors.toList()));
    }

    private String buildTextSummary(AnalysisData data) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Học sinh có %d bài thi. Điểm TB: %.2f/10. Tỷ lệ đạt: %.1f%%. ",
                data.totalExams, data.avgScore, data.passRate));

        if (!data.strengths.isEmpty()) {
            sb.append("Điểm mạnh: ").append(String.join(", ", data.strengths.stream().limit(3).toList())).append(". ");
        }
        if (!data.weaknesses.isEmpty()) {
            sb.append("Cần cải thiện: ").append(String.join(", ", data.weaknesses.stream().limit(3).toList()))
                    .append(". ");
        }
        return sb.toString();
    }

    private AIInsightDTO generateFallbackInsights(AnalysisData data, Long studentId) {
        AIInsightDTO insight = new AIInsightDTO();
        insight.setStudentId(studentId);

        // Xác định summary dựa trên điểm số
        String level = data.avgScore >= EXCELLENT_THRESHOLD ? "xuất sắc"
                : data.avgScore >= GOOD_THRESHOLD ? "tốt" : "cần cải thiện";

        insight.setOverallSummary(String.format(
                "Học sinh có thành tích %s với điểm trung bình %.2f/10. Tỷ lệ đạt: %.1f%%.",
                level, data.avgScore, data.passRate));

        insight.setKeyStrengths(data.strengths.isEmpty() ? List.of("Hoàn thành đầy đủ các bài thi")
                : data.strengths.stream().limit(5).map(s -> s + " đạt kết quả tốt").toList());

        insight.setAreasForImprovement(data.weaknesses.isEmpty() ? List.of("Nỗ lực duy trì phong độ")
                : data.weaknesses.stream().limit(5).map(w -> w + " cần xem lại kiến thức").toList());

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
