package com.igcse.ai.service.grading;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.igcse.ai.dto.*;
import com.igcse.ai.strategy.GradingStrategy;
import com.igcse.ai.strategy.GradingStrategyFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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
    private final ObjectMapper objectMapper;

    @Autowired
    public AnswerGradingService(ILanguageService languageService,
            GradingStrategyFactory gradingStrategyFactory) {
        this.languageService = languageService;
        this.gradingStrategyFactory = gradingStrategyFactory;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public List<GradingResult> gradeAllAnswers(String answersJson, String language) {
        List<GradingResult> results = new ArrayList<>();
        String lang = languageService.normalizeLanguage(language);

        logger.debug("Starting to grade all answers, language: {}", lang);

        try {
            ExamAnswersDTO examAnswers = objectMapper.readValue(answersJson, ExamAnswersDTO.class);

            if (examAnswers.getAnswers() == null || examAnswers.getAnswers().isEmpty()) {
                logger.warn("No answers found in the request");
                return results;
            }

            logger.info("Grading {} answers", examAnswers.getAnswers().size());

            for (AnswerDTO answer : examAnswers.getAnswers()) {
                GradingResult result = gradeAnswer(answer, lang);
                results.add(result);
            }

            logger.info("Successfully graded {} answers", results.size());

        } catch (Exception e) {
            logger.error("Error parsing answers JSON", e);
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

        long correctCount = results.stream()
                .filter(GradingResult::isCorrect)
                .count();

        StringBuilder feedback = new StringBuilder();

        // Tổng điểm
        feedback.append(languageService.getTotalScoreFormat(language, totalScore, maxScore, percentage));
        feedback.append("\n\n");

        // Số câu đúng
        feedback.append(languageService.getCorrectCountFormat(language, correctCount, results.size()));
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
