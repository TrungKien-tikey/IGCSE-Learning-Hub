package com.igcse.ai.service.analytics;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.igcse.ai.dto.AIInsightDTO;
import com.igcse.ai.dto.GradingResult;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.repository.AIResultRepository;
import com.igcse.ai.service.llm.OpenAIService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class InsightService implements IInsightService {

    private static final Logger logger = LoggerFactory.getLogger(InsightService.class);

    private final AIResultRepository aiResultRepository;
    private final ObjectMapper objectMapper;
    @SuppressWarnings("unused")
    private final OpenAIService openAIService; // Reserved for future AI insight generation

    @Autowired
    public InsightService(AIResultRepository aiResultRepository, OpenAIService openAIService) {
        this.aiResultRepository = aiResultRepository;
        this.openAIService = openAIService;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public AIInsightDTO getInsight(Long studentId) {
        logger.info("Getting insights for studentId: {}", studentId);
        Objects.requireNonNull(studentId, "Student ID cannot be null");

        List<AIResult> results = aiResultRepository.findByStudentId(studentId);

        AIInsightDTO insight = new AIInsightDTO();
        insight.setStudentId(studentId);

        if (results.isEmpty()) {
            logger.debug("No results found for studentId: {}", studentId);
            insight.setOverallSummary("Chưa có dữ liệu để phân tích.");
            insight.setKeyStrengths(new ArrayList<>());
            insight.setAreasForImprovement(new ArrayList<>());
            insight.setActionPlan("Vui lòng hoàn thành bài thi để nhận được insights.");
            return insight;
        }

        // Tổng hợp dữ liệu thành text summary
        String dataSummary = buildDataSummary(results);

        // Thử dùng AI để generate insights
        try {
            String aiInsight = generateInsightWithAI(dataSummary, "vi");
            AIInsightDTO parsedInsight = parseAIInsightResponse(aiInsight);
            if (parsedInsight != null) {
                parsedInsight.setStudentId(studentId);
                logger.info("AI insights generated successfully for studentId: {}", studentId);
                return parsedInsight;
            }
        } catch (Exception e) {
            logger.warn("Failed to generate AI insights, using fallback: {}", e.getMessage());
        }

        // Fallback: Generate insights từ dữ liệu thật không dùng AI
        return generateFallbackInsights(results, studentId);
    }

    /**
     * Tổng hợp dữ liệu thành text summary
     */
    private String buildDataSummary(List<AIResult> results) {
        StringBuilder summary = new StringBuilder();
        summary.append("Học sinh có ").append(results.size()).append(" bài thi đã chấm. ");

        double avgScore = results.stream()
                .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0.0)
                .average()
                .orElse(0.0);
        summary.append("Điểm trung bình: ").append(String.format("%.2f", avgScore)).append("/10. ");

        long passedCount = results.stream()
                .filter(AIResult::isPassed)
                .count();
        summary.append("Số bài đạt: ").append(passedCount).append("/").append(results.size()).append(". ");

        // Phân tích điểm mạnh/yếu từ details
        List<String> strengths = new ArrayList<>();
        List<String> weaknesses = new ArrayList<>();

        for (AIResult result : results) {
            if (result.getDetails() != null && !result.getDetails().isEmpty()) {
                try {
                    List<GradingResult> details = parseDetails(result.getDetails());
                    for (GradingResult gr : details) {
                        if (gr.getScore() != null && gr.getMaxScore() != null) {
                            double percentage = (gr.getScore() / gr.getMaxScore()) * 100;
                            if (percentage >= 80) {
                                strengths.add("Câu " + gr.getQuestionId() + " đạt " + String.format("%.1f", percentage) + "%");
                            } else if (percentage < 50) {
                                weaknesses.add("Câu " + gr.getQuestionId() + " chỉ đạt " + String.format("%.1f", percentage) + "%");
                            }
                        }
                    }
                } catch (Exception e) {
                    logger.debug("Failed to parse details for resultId: {}", result.getResultId(), e);
                }
            }
        }

        if (!strengths.isEmpty()) {
            summary.append("Điểm mạnh: ").append(String.join(", ", strengths.stream().limit(3).collect(Collectors.toList()))).append(". ");
        }
        if (!weaknesses.isEmpty()) {
            summary.append("Cần cải thiện: ").append(String.join(", ", weaknesses.stream().limit(3).collect(Collectors.toList()))).append(". ");
        }

        return summary.toString();
    }

    /**
     * Gọi OpenAI để generate insights
     * TODO: Implement method này khi có method generateInsight trong OpenAIService
     */
    @SuppressWarnings("unused")
    private String generateInsightWithAI(String dataSummary, String language) {
        try {
            // TODO: Thêm method generateInsight vào OpenAIService và gọi ở đây
            // String prompt = String.format(...);
            // return openAIService.generateInsight(prompt, language);
            logger.debug("AI insight generation not yet implemented, using fallback");
            return null;
        } catch (Exception e) {
            logger.error("Error generating AI insight", e);
            return null;
        }
    }

    /**
     * Parse AI response thành AIInsightDTO
     */
    private AIInsightDTO parseAIInsightResponse(String aiResponse) {
        if (aiResponse == null || aiResponse.trim().isEmpty()) {
            return null;
        }

        try {
            // Parse JSON response
            Map<String, Object> responseMap = objectMapper.readValue(aiResponse, 
                    objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class));
            AIInsightDTO insight = new AIInsightDTO();
            insight.setOverallSummary((String) responseMap.get("overallSummary"));
            
            @SuppressWarnings("unchecked")
            List<String> strengths = (List<String>) responseMap.get("keyStrengths");
            insight.setKeyStrengths(strengths != null ? strengths : new ArrayList<>());
            
            @SuppressWarnings("unchecked")
            List<String> improvements = (List<String>) responseMap.get("areasForImprovement");
            insight.setAreasForImprovement(improvements != null ? improvements : new ArrayList<>());
            
            insight.setActionPlan((String) responseMap.get("actionPlan"));
            
            return insight;
        } catch (Exception e) {
            logger.error("Failed to parse AI insight response", e);
            return null;
        }
    }

    /**
     * Generate insights fallback không dùng AI
     */
    private AIInsightDTO generateFallbackInsights(List<AIResult> results, Long studentId) {
        AIInsightDTO insight = new AIInsightDTO();
        insight.setStudentId(studentId);

        double avgScore = results.stream()
                .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0.0)
                .average()
                .orElse(0.0);

        long passedCount = results.stream().filter(AIResult::isPassed).count();
        double passRate = (double) passedCount / results.size() * 100;

        // Overall summary
        if (avgScore >= 8.0) {
            insight.setOverallSummary(String.format(
                    "Học sinh có thành tích xuất sắc với điểm trung bình %.2f/10. Tỷ lệ đạt: %.1f%%.", 
                    avgScore, passRate));
        } else if (avgScore >= 5.0) {
            insight.setOverallSummary(String.format(
                    "Học sinh có thành tích tốt với điểm trung bình %.2f/10. Tỷ lệ đạt: %.1f%%.", 
                    avgScore, passRate));
        } else {
            insight.setOverallSummary(String.format(
                    "Học sinh cần cải thiện với điểm trung bình %.2f/10. Tỷ lệ đạt: %.1f%%.", 
                    avgScore, passRate));
        }

        // Key strengths và areas for improvement từ details
        List<String> strengths = new ArrayList<>();
        List<String> improvements = new ArrayList<>();

        for (AIResult result : results) {
            if (result.getDetails() != null && !result.getDetails().isEmpty()) {
                try {
                    List<GradingResult> details = parseDetails(result.getDetails());
                    for (GradingResult gr : details) {
                        if (gr.getScore() != null && gr.getMaxScore() != null) {
                            double percentage = (gr.getScore() / gr.getMaxScore()) * 100;
                            if (percentage >= 80) {
                                strengths.add("Câu hỏi " + gr.getQuestionId() + " đạt điểm cao");
                            } else if (percentage < 50) {
                                improvements.add("Câu hỏi " + gr.getQuestionId() + " cần cải thiện");
                            }
                        }
                    }
                } catch (Exception e) {
                    logger.debug("Failed to parse details", e);
                }
            }
        }

        if (strengths.isEmpty()) {
            strengths.add("Hoàn thành đầy đủ các bài thi");
        }
        if (improvements.isEmpty()) {
            improvements.add("Cần nỗ lực hơn để cải thiện điểm số");
        }

        insight.setKeyStrengths(strengths.stream().distinct().limit(5).collect(Collectors.toList()));
        insight.setAreasForImprovement(improvements.stream().distinct().limit(5).collect(Collectors.toList()));
        insight.setActionPlan("Tập trung vào các câu hỏi cần cải thiện và ôn tập lại kiến thức cơ bản.");

        return insight;
    }

    /**
     * Parse details JSON thành List<GradingResult>
     */
    private List<GradingResult> parseDetails(String detailsJson) {
        try {
            return objectMapper.readValue(
                    detailsJson,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, GradingResult.class)
            );
        } catch (Exception e) {
            logger.error("Failed to parse details JSON", e);
            return new ArrayList<>();
        }
    }
}
