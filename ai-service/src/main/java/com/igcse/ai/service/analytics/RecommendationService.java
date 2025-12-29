package com.igcse.ai.service.analytics;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.igcse.ai.dto.GradingResult;
import com.igcse.ai.dto.LearningRecommendationDTO;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.repository.AIResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService implements IRecommendationService {

    private static final Logger logger = LoggerFactory.getLogger(RecommendationService.class);

    private final AIResultRepository aiResultRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public RecommendationService(AIResultRepository aiResultRepository) {
        this.aiResultRepository = aiResultRepository;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public LearningRecommendationDTO getRecommendations(Long studentId) {
        logger.info("Getting recommendations for studentId: {}", studentId);
        Objects.requireNonNull(studentId, "Student ID cannot be null");

        List<AIResult> results = aiResultRepository.findByStudentId(studentId);

        LearningRecommendationDTO rec = new LearningRecommendationDTO();
        rec.setStudentId(studentId);

        if (results.isEmpty()) {
            logger.debug("No results found for studentId: {}", studentId);
            rec.setWeakTopics(new ArrayList<>());
            rec.setStrongTopics(new ArrayList<>());
            rec.setRecommendedResources(new ArrayList<>());
            rec.setLearningPathSuggestion("Vui lòng hoàn thành bài thi để nhận được gợi ý học tập.");
            return rec;
        }

        // Phân tích điểm theo questionId từ details JSON
        Map<Long, List<Double>> questionScores = new HashMap<>(); // questionId -> list of scores

        for (AIResult result : results) {
            if (result.getDetails() != null && !result.getDetails().isEmpty()) {
                try {
                    List<GradingResult> details = parseDetails(result.getDetails());
                    for (GradingResult gr : details) {
                        if (gr.getQuestionId() != null && gr.getScore() != null && gr.getMaxScore() != null) {
                            // Tính điểm phần trăm
                            double percentage = (gr.getScore() / gr.getMaxScore()) * 100.0;
                            questionScores.computeIfAbsent(gr.getQuestionId(), k -> new ArrayList<>())
                                    .add(percentage);
                        }
                    }
                } catch (Exception e) {
                    logger.debug("Failed to parse details for resultId: {}", result.getResultId(), e);
                }
            }
        }

        // Xác định điểm mạnh/yếu
        // Weak: điểm trung bình < 50%
        // Strong: điểm trung bình >= 80%
        List<String> weakTopics = new ArrayList<>();
        List<String> strongTopics = new ArrayList<>();

        questionScores.forEach((questionId, scores) -> {
            double avgScore = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            String topicLabel = "Câu hỏi " + questionId;
            
            if (avgScore < 50.0) {
                weakTopics.add(topicLabel + " (điểm TB: " + String.format("%.1f", avgScore) + "%)");
            } else if (avgScore >= 80.0) {
                strongTopics.add(topicLabel + " (điểm TB: " + String.format("%.1f", avgScore) + "%)");
            }
        });

        // Nếu không có dữ liệu chi tiết, phân tích theo điểm tổng
        if (weakTopics.isEmpty() && strongTopics.isEmpty()) {
            analyzeByOverallScore(results, weakTopics, strongTopics);
        }

        rec.setWeakTopics(weakTopics.stream().distinct().limit(10).collect(Collectors.toList()));
        rec.setStrongTopics(strongTopics.stream().distinct().limit(10).collect(Collectors.toList()));

        // Tạo recommended resources dựa trên weakTopics
        List<String> recommendedResources = generateResources(weakTopics);
        rec.setRecommendedResources(recommendedResources);

        // Tạo learning path suggestion
        String learningPath = generateLearningPathSuggestion(weakTopics, strongTopics, results);
        rec.setLearningPathSuggestion(learningPath);

        logger.debug("Recommendations generated for studentId: {}, weakTopics: {}, strongTopics: {}", 
                studentId, weakTopics.size(), strongTopics.size());

        return rec;
    }

    /**
     * Phân tích theo điểm tổng nếu không có details
     */
    private void analyzeByOverallScore(List<AIResult> results, List<String> weakTopics, List<String> strongTopics) {
        double avgScore = results.stream()
                .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0.0)
                .average()
                .orElse(0.0);

        if (avgScore < 5.0) {
            weakTopics.add("Tổng thể cần cải thiện (điểm TB: " + String.format("%.2f", avgScore) + "/10)");
        } else if (avgScore >= 8.0) {
            strongTopics.add("Tổng thể xuất sắc (điểm TB: " + String.format("%.2f", avgScore) + "/10)");
        }
    }

    /**
     * Tạo recommended resources dựa trên weakTopics
     */
    private List<String> generateResources(List<String> weakTopics) {
        List<String> resources = new ArrayList<>();
        
        if (weakTopics.isEmpty()) {
            resources.add("Tiếp tục duy trì phong độ hiện tại");
            return resources;
        }

        // Tạo resources dựa trên số lượng weakTopics
        int weakCount = weakTopics.size();
        if (weakCount > 0) {
            resources.add("Video bài giảng: Ôn tập lại các chủ đề cần cải thiện");
        }
        if (weakCount > 2) {
            resources.add("Bài tập thực hành: Làm thêm bài tập để củng cố kiến thức");
        }
        if (weakCount > 5) {
            resources.add("Học nhóm: Thảo luận với bạn bè về các chủ đề khó");
        }

        // Thêm resources cụ thể cho từng weakTopic
        weakTopics.stream()
                .limit(3)
                .forEach(topic -> {
                    String resource = "Tài liệu tham khảo cho " + topic;
                    resources.add(resource);
                });

        return resources.stream().distinct().limit(5).collect(Collectors.toList());
    }

    /**
     * Tạo learning path suggestion
     */
    private String generateLearningPathSuggestion(List<String> weakTopics, List<String> strongTopics, 
                                                   List<AIResult> results) {
        StringBuilder suggestion = new StringBuilder();

        if (weakTopics.isEmpty() && !strongTopics.isEmpty()) {
            suggestion.append("Bạn đang có thành tích tốt! Tiếp tục duy trì và mở rộng kiến thức.");
        } else if (!weakTopics.isEmpty()) {
            suggestion.append("Bạn nên tập trung vào ");
            suggestion.append(String.join(", ", weakTopics.stream().limit(3).collect(Collectors.toList())));
            suggestion.append(" để cải thiện điểm số. ");
            
            if (!strongTopics.isEmpty()) {
                suggestion.append("Duy trì phong độ ở các chủ đề mạnh: ");
                suggestion.append(String.join(", ", strongTopics.stream().limit(2).collect(Collectors.toList())));
                suggestion.append(".");
            }
        } else {
            double avgScore = results.stream()
                    .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0.0)
                    .average()
                    .orElse(0.0);
            suggestion.append(String.format("Điểm trung bình: %.2f/10. ", avgScore));
            suggestion.append("Tiếp tục nỗ lực để cải thiện kết quả học tập.");
        }

        return suggestion.toString();
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
