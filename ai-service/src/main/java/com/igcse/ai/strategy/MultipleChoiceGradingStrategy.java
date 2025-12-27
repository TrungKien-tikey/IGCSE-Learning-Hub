package com.igcse.ai.strategy;

import com.igcse.ai.dto.AnswerDTO;
import com.igcse.ai.dto.GradingResult;
import com.igcse.ai.dto.MultipleChoiceAnswer;
import com.igcse.ai.service.grading.ConfidenceCalculator;
import com.igcse.ai.service.common.LanguageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class MultipleChoiceGradingStrategy implements GradingStrategy {

    private final LanguageService languageService;
    private final ConfidenceCalculator confidenceCalculator;

    @Autowired
    public MultipleChoiceGradingStrategy(LanguageService languageService, ConfidenceCalculator confidenceCalculator) {
        this.languageService = languageService;
        this.confidenceCalculator = confidenceCalculator;
    }

    @Override
    public GradingResult grade(AnswerDTO answer, String language) {
        if (!(answer instanceof MultipleChoiceAnswer)) {
            throw new IllegalArgumentException("Answer is not Multiple Choice");
        }

        MultipleChoiceAnswer mcAnswer = (MultipleChoiceAnswer) answer;
        boolean isCorrect = mcAnswer.isCorrect();
        Double maxScore = 1.0; // Mỗi câu trắc nghiệm thường là 1 điểm

        Double score = isCorrect ? maxScore : 0.0;
        String feedback = isCorrect
                ? languageService.getCorrectAnswerFeedback(language)
                : languageService.getWrongAnswerFeedback(language, mcAnswer.getCorrectOption());

        double confidence = confidenceCalculator.calculateMultipleChoiceConfidence();

        return new GradingResult(
                answer.getQuestionId(),
                "MULTIPLE_CHOICE",
                score,
                maxScore,
                feedback,
                isCorrect,
                confidence,
                "LOCAL_RULE_BASED");
    }

    @Override
    public boolean supports(String answerType) {
        return "MULTIPLE_CHOICE".equalsIgnoreCase(answerType);
    }
}
