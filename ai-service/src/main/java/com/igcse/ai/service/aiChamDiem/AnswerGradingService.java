package com.igcse.ai.service.aiChamDiem;

import com.igcse.ai.dto.aiChamDiem.AnswerDTO;
import com.igcse.ai.dto.aiChamDiem.GradingResult;
import com.igcse.ai.strategy.GradingStrategy;
import com.igcse.ai.strategy.GradingStrategyFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

import com.igcse.ai.service.common.ILanguageService;
import com.igcse.ai.service.common.LanguageService;

@Service
public class AnswerGradingService implements IGradingService {
    private static final Logger logger = LoggerFactory.getLogger(AnswerGradingService.class);

    private final ILanguageService languageService;
    private final GradingStrategyFactory gradingStrategyFactory;
    private final java.util.concurrent.Executor taskExecutor;

    public AnswerGradingService(
            ILanguageService languageService,
            GradingStrategyFactory gradingStrategyFactory,
            @org.springframework.beans.factory.annotation.Qualifier("taskExecutor") java.util.concurrent.Executor taskExecutor) {
        this.languageService = languageService;
        this.gradingStrategyFactory = gradingStrategyFactory;
        this.taskExecutor = taskExecutor;
    }

    @Override
    public List<GradingResult> gradeAllAnswers(List<AnswerDTO> answers, String language) {
        List<GradingResult> results = new ArrayList<>();
        String lang = languageService.normalizeLanguage(language);

        logger.debug("Starting to grade all answers, language: {}", lang);

        if (answers == null || answers.isEmpty()) {
            logger.warn("No answers found in the request");
            return results;
        }

        logger.info("Grading {} answers", answers.size());

        try {
            List<java.util.concurrent.CompletableFuture<GradingResult>> futures = new ArrayList<>();

            for (AnswerDTO answer : answers) {
                java.util.concurrent.CompletableFuture<GradingResult> future = java.util.concurrent.CompletableFuture
                        .supplyAsync(() -> {
                            try {
                                return gradeAnswer(answer, lang);
                            } catch (Exception e) {
                                logger.error("Error grading answer type {}: {}", answer.getType(), e.getMessage());
                                return new GradingResult(
                                        answer.getQuestionId(),
                                        answer.getType(),
                                        0.0,
                                        0.0,
                                        "Error grading answer: " + e.getMessage(),
                                        false,
                                        0.0,
                                        "ERROR");
                            }
                        }, taskExecutor);
                futures.add(future);
            }

            // Wait for all to complete
            java.util.concurrent.CompletableFuture.allOf(futures.toArray(new java.util.concurrent.CompletableFuture[0]))
                    .join();

            // Collect results
            for (java.util.concurrent.CompletableFuture<GradingResult> future : futures) {
                try {
                    results.add(future.get());
                } catch (Exception e) {
                    logger.error("Error retrieving grading result", e);
                }
            }

            logger.info("Successfully graded {} answers", results.size());

        } catch (Exception e) {
            logger.error("Error grading answers", e);
        }

        return results;
    }

    /**
     * Chấm điểm một câu trả lời với ngôn ngữ chỉ định
     */
    @Override
    public GradingResult gradeAnswer(AnswerDTO answer, String language) {
        GradingStrategy strategy = gradingStrategyFactory.getStrategy(answer.getType());
        return strategy.grade(answer, language);
    }

    /**
     * Tính tổng điểm từ danh sách kết quả chấm điểm
     */
    @Override
    public double calculateTotalScore(List<GradingResult> results) {
        return results.stream()
                .mapToDouble(GradingResult::getScore)
                .sum();
    }

    /**
     * Tính điểm tối đa từ danh sách kết quả
     */
    @Override
    public double calculateMaxScore(List<GradingResult> results) {
        return results.stream()
                .mapToDouble(GradingResult::getMaxScore)
                .sum();
    }

    /**
     * Tính confidence trung bình từ danh sách kết quả
     */
    @Override
    public double calculateAverageConfidence(List<GradingResult> results) {
        if (results == null || results.isEmpty()) {
            return 0.0;
        }
        return results.stream()
                .mapToDouble(GradingResult::getConfidence)
                .average()
                .orElse(0.0);
    }

    /**
     * Tạo feedback tổng hợp từ tất cả kết quả chấm điểm với ngôn ngữ chỉ định
     */
    @Override
    public String generateOverallFeedback(List<GradingResult> results, String language) {
        if (results == null || results.isEmpty()) {
            return languageService.getNoResultMessage(language);
        }

        double totalScore = calculateTotalScore(results);
        double maxScore = calculateMaxScore(results);
        double percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

        StringBuilder feedback = new StringBuilder();

        // Tổng điểm
        feedback.append(languageService.getTotalScoreFormat(language, totalScore, maxScore, percentage));
        feedback.append("\n\n");

        // Đánh giá theo phần trăm
        feedback.append(languageService.getFeedbackByPercentage(language, percentage));
        feedback.append("\n\n");

        // Chi tiết từng câu
        feedback.append(languageService.getDetailHeader(language)).append("\n");

        boolean isVietnamese = LanguageService.VIETNAMESE.equals(language);
        for (GradingResult result : results) {
            if (isVietnamese) {
                feedback.append(String.format("- Câu %d: %.2f / %.2f (Độ tin cậy: %.0f%%) - %s\n",
                        result.getQuestionId(),
                        result.getScore(),
                        result.getMaxScore(),
                        result.getConfidence() * 100,
                        result.getFeedback()));
            } else {
                feedback.append(String.format("- Q%d: %.2f / %.2f (Confidence: %.0f%%) - %s\n",
                        result.getQuestionId(),
                        result.getScore(),
                        result.getMaxScore(),
                        result.getConfidence() * 100,
                        result.getFeedback()));
            }
        }

        return feedback.toString();
    }
}
