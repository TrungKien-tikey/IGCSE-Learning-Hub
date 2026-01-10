package com.igcse.ai.service.ass.goiyLoTrinhHoc;

import com.igcse.ai.service.common.ILanguageService;
import com.igcse.ai.service.common.JsonService;
import com.igcse.ai.dto.aiChamDiem.GradingResult;
import com.igcse.ai.dto.goiyLoTrinhHoc.LearningRecommendationDTO;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.entity.AIRecommendation;
import com.igcse.ai.repository.AIResultRepository;
import com.igcse.ai.repository.AIRecommendationRepository;
import com.igcse.ai.repository.AIProgressRepository;
import com.igcse.ai.service.common.TierManagerService;
import com.igcse.ai.service.llm.RecommendationAiService;
import com.fasterxml.jackson.core.type.TypeReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService implements IRecommendationService {

    private static final Logger logger = LoggerFactory.getLogger(RecommendationService.class);

    private final AIResultRepository aiResultRepository;
    private final AIRecommendationRepository aiRecommendationRepository;
    private final JsonService jsonService;
    private final ILanguageService languageService;
    private final AIProgressRepository aiProgressRepository;
    private final TierManagerService tierManagerService;
    private final RecommendationAiService recommendationAiService;

    public RecommendationService(AIResultRepository aiResultRepository,
            RecommendationAiService recommendationAiService, JsonService jsonService,
            ILanguageService languageService,
            AIRecommendationRepository aiRecommendationRepository,
            AIProgressRepository aiProgressRepository,
            TierManagerService tierManagerService) {
        this.aiResultRepository = aiResultRepository;
        this.recommendationAiService = recommendationAiService;
        this.jsonService = jsonService;
        this.languageService = languageService;
        this.aiRecommendationRepository = aiRecommendationRepository;
        this.aiProgressRepository = aiProgressRepository;
        this.tierManagerService = tierManagerService;
    }

    @Override
    public LearningRecommendationDTO getRecommendations(Long studentId) {
        logger.info("Getting recommendations for studentId: {}", studentId);
        Objects.requireNonNull(studentId, "Student ID cannot be null");

        // ✅ BƯỚC 1: Kiểm tra cache
        Optional<AIRecommendation> cached = aiRecommendationRepository
                .findTopByStudentIdOrderByGeneratedAtDesc(studentId);
        if (cached.isPresent()) {
            logger.info("Returning latest cached recommendation for studentId: {}", studentId);
            return convertToDTO(cached.get());
        }

        // ✅ BƯỚC 2: Không có cache, tạo mới
        return refreshRecommendation(studentId, null);
    }

    @Override
    public void triggerUpdate(Long studentId, String nifiData) {
        logger.info("Manual trigger update for studentId: {} with data size: {}",
                studentId, (nifiData != null ? nifiData.length() : "null"));
        refreshRecommendation(studentId, nifiData);
    }

    @Transactional
    private LearningRecommendationDTO refreshRecommendation(Long studentId, String nifiData) {
        List<AIResult> results = aiResultRepository.findByStudentId(studentId);
        TierManagerService.AnalysisData analysis = tierManagerService.analyzeResults(results);

        // Tổng hợp dữ liệu cũ
        String dataSummary = buildDataSummary(results);

        // Nếu NiFi có gửi thêm dữ liệu "nóng hổi", mình ưu tiên đưa lên đầu
        if (nifiData != null && !nifiData.isEmpty()) {
            dataSummary = "DỮ LIỆU MỚI NHẤT TỪ HỆ THỐNG: " + nifiData + "\n\n" + dataSummary;
        }

        if (results.isEmpty() && (nifiData == null || nifiData.isEmpty())) {
            logger.debug("No results found for studentId: {}", studentId);
            LearningRecommendationDTO rec = new LearningRecommendationDTO();
            rec.setStudentId(studentId);
            rec.setWeakTopics(new ArrayList<>());
            rec.setStrongTopics(new ArrayList<>());
            rec.setRecommendedResources(new ArrayList<>());
            rec.setLearningPathSuggestion("Vui lòng hoàn thành bài thi để nhận được gợi ý học tập.");
            return rec;
        }

        // ✅ KIỂM TRA SMART TRIGGER: Dùng chung qua TierManager
        if (shouldSkipAiUpdate(studentId, analysis.avgScore(), nifiData)) {
            logger.info("Skipping AI update for studentId: {} - Data has not changed significantly.", studentId);
            return aiRecommendationRepository.findTopByStudentIdOrderByGeneratedAtDesc(studentId)
                    .map(this::convertToDTO)
                    .orElseGet(() -> generateFallbackRecommendations(results, studentId));
        }

        // Thử dùng AI để generate recommendations
        LearningRecommendationDTO newRecommendation = null;
        boolean isAiGenerated = false;

        try {
            String aiLanguageName = languageService.getAiLanguageName("vi");
            newRecommendation = recommendationAiService.generateRecommendation(dataSummary, aiLanguageName);
            if (newRecommendation != null) {
                newRecommendation.setStudentId(studentId);
                isAiGenerated = true;
                logger.info("AI recommendations generated successfully for studentId: {}", studentId);
            }
        } catch (Exception e) {
            logger.warn("Failed to generate AI recommendations, using fallback: {}", e.getMessage());
        }

        // Fallback nếu AI lỗi
        if (newRecommendation == null) {
            newRecommendation = generateFallbackRecommendations(results, studentId);
            isAiGenerated = false;
        }

        // ✅ BƯỚC 3: Lưu vào cache (Lưu mới, không xóa cũ để giữ history)
        saveRecommendationToCache(newRecommendation, isAiGenerated);
        tierManagerService.resetCounter(studentId);

        return newRecommendation;
    }

    /**
     * Logic thông minh để quyết định có nên gọi AI hay không
     */
    private boolean shouldSkipAiUpdate(Long studentId, double currentAvgScore, String nifiData) {
        // 1. Phím tắt: nifiData luôn chạy
        if (nifiData != null && !nifiData.isEmpty())
            return false;

        // 2. Delegate cho TierManager
        return !tierManagerService.shouldTriggerTier2(studentId, currentAvgScore);
    }

    /**
     * Tổng hợp dữ liệu thành text summary
     */
    private String buildDataSummary(List<AIResult> results) {
        StringBuilder summary = new StringBuilder();
        summary.append("Học sinh đã hoàn thành ").append(results.size()).append(" bài thi. ");

        double avgScore = results.stream()
                .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0.0)
                .average()
                .orElse(0.0);
        summary.append("Điểm trung bình toàn bảng: ").append(String.format("%.2f", avgScore)).append("/10. ");

        // Phân tích chi tiết từng kỹ năng/chủ đề qua questionId
        Map<Long, List<Double>> questionScores = new HashMap<>();
        for (AIResult result : results) {
            if (result.getDetails() != null && !result.getDetails().isEmpty()) {
                List<GradingResult> details = jsonService.parseGradingDetails(result.getDetails());
                for (GradingResult gr : details) {
                    if (gr.getQuestionId() != null && gr.getScore() != null && gr.getMaxScore() != null) {
                        double percentage = (gr.getScore() / gr.getMaxScore()) * 100.0;
                        questionScores.computeIfAbsent(gr.getQuestionId(), k -> new ArrayList<>()).add(percentage);
                    }
                }
            }
        }

        if (!questionScores.isEmpty()) {
            summary.append("Chi tiết từng phần: ");
            questionScores.forEach((id, scores) -> {
                double avg = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                summary.append("- Câu hỏi/Chủ đề ").append(id).append(": ").append(String.format("%.1f", avg))
                        .append("%; ");
            });
        }

        return summary.toString();
    }

    /**
     * Logic fallback cũ (được đổi tên từ getRecommendations cũ)
     */
    private LearningRecommendationDTO generateFallbackRecommendations(List<AIResult> results, Long studentId) {
        LearningRecommendationDTO rec = new LearningRecommendationDTO();
        rec.setStudentId(studentId);

        // Phân tích điểm theo questionId từ details JSON
        Map<Long, List<Double>> questionScores = new HashMap<>();

        for (AIResult result : results) {
            if (result.getDetails() != null && !result.getDetails().isEmpty()) {
                try {
                    List<GradingResult> details = jsonService.parseGradingDetails(result.getDetails());
                    for (GradingResult gr : details) {
                        if (gr.getQuestionId() != null && gr.getScore() != null && gr.getMaxScore() != null) {
                            double percentage = (gr.getScore() / gr.getMaxScore()) * 100.0;
                            questionScores.computeIfAbsent(gr.getQuestionId(), k -> new ArrayList<>()).add(percentage);
                        }
                    }
                } catch (Exception e) {
                    logger.debug("Failed to parse details", e);
                }
            }
        }

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

        if (weakTopics.isEmpty() && strongTopics.isEmpty()) {
            analyzeByOverallScore(results, weakTopics, strongTopics);
        }

        rec.setWeakTopics(weakTopics.stream().distinct().limit(10).collect(Collectors.toList()));
        rec.setStrongTopics(strongTopics.stream().distinct().limit(10).collect(Collectors.toList()));

        // Gợi ý tài liệu và lộ trình
        rec.setRecommendedResources(generateResources(weakTopics));
        rec.setLearningPathSuggestion(generateLearningPathSuggestion(weakTopics, strongTopics, results));

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

    // ✅ THÊM: Convert Entity to DTO
    private LearningRecommendationDTO convertToDTO(AIRecommendation entity) {
        LearningRecommendationDTO dto = new LearningRecommendationDTO();
        dto.setStudentId(entity.getStudentId());
        dto.setLearningPathSuggestion(entity.getLearningPathSuggestion());

        // Parse JSON arrays
        try {
            if (entity.getWeakTopics() != null && !entity.getWeakTopics().isEmpty()) {
                List<String> weakTopics = jsonService.getObjectMapper().readValue(
                        entity.getWeakTopics(),
                        new TypeReference<List<String>>() {
                        });
                dto.setWeakTopics(weakTopics);
            }

            if (entity.getStrongTopics() != null && !entity.getStrongTopics().isEmpty()) {
                List<String> strongTopics = jsonService.getObjectMapper().readValue(
                        entity.getStrongTopics(),
                        new TypeReference<List<String>>() {
                        });
                dto.setStrongTopics(strongTopics);
            }

            if (entity.getRecommendedResources() != null && !entity.getRecommendedResources().isEmpty()) {
                List<String> resources = jsonService.getObjectMapper().readValue(
                        entity.getRecommendedResources(),
                        new TypeReference<List<String>>() {
                        });
                dto.setRecommendedResources(resources);
            }
        } catch (Exception e) {
            logger.error("Error parsing JSON in cached recommendation", e);
            dto.setWeakTopics(new ArrayList<>());
            dto.setStrongTopics(new ArrayList<>());
            dto.setRecommendedResources(new ArrayList<>());
        }

        return dto;
    }

    // ✅ THÊM: Save to cache
    private void saveRecommendationToCache(LearningRecommendationDTO dto, boolean isAiGenerated) {
        try {
            // ✅ BƯỚC 1: Lấy các bản ghi cũ chưa được đúc kết
            List<AIRecommendation> unlinked = aiRecommendationRepository
                    .findTop5ByStudentIdAndProgressIdIsNullOrderByGeneratedAtDesc(dto.getStudentId());

            // ✅ BƯỚC 2: Tạo Entity mới
            AIRecommendation entity = new AIRecommendation();
            entity.setStudentId(dto.getStudentId());
            entity.setLearningPathSuggestion(dto.getLearningPathSuggestion());
            entity.setIsAiGenerated(isAiGenerated);
            entity.setLanguage("vi");

            try {
                if (dto.getWeakTopics() != null) {
                    entity.setWeakTopics(jsonService.toJson(dto.getWeakTopics()));
                }
                if (dto.getStrongTopics() != null) {
                    entity.setStrongTopics(jsonService.toJson(dto.getStrongTopics()));
                }
                if (dto.getRecommendedResources() != null) {
                    entity.setRecommendedResources(jsonService.toJson(dto.getRecommendedResources()));
                }
            } catch (Exception e) {
                logger.error("Error converting to JSON", e);
            }

            AIRecommendation savedRec = aiRecommendationRepository.save(entity);

            // ✅ BƯỚC 3: Liên kết với Progress hiện tại (nếu có)
            aiProgressRepository.findTopByStudentIdOrderByGeneratedAtDesc(dto.getStudentId())
                    .ifPresent(progress -> {
                        savedRec.setProgressId(progress.getProgressId());
                        aiRecommendationRepository.save(savedRec);

                        // Cập nhật luôn cho các bản cũ chưa liên kết
                        for (AIRecommendation old : unlinked) {
                            old.setProgressId(progress.getProgressId());
                            aiRecommendationRepository.save(old);
                        }
                    });

            logger.info("Saved recommendation and linked to progress for studentId: {}", dto.getStudentId());
        } catch (Exception e) {
            logger.error("Error saving recommendation to cache", e);
        }
    }

}
