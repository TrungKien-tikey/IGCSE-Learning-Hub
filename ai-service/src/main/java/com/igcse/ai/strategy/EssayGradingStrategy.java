package com.igcse.ai.strategy;

import com.igcse.ai.dto.AnswerDTO;
import com.igcse.ai.dto.EssayAnswer;
import com.igcse.ai.dto.GradingResult;
import com.igcse.ai.service.grading.ConfidenceCalculator;
import com.igcse.ai.service.llm.OpenAIService;
import com.igcse.ai.service.llm.LangChainConfidenceEvaluator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class EssayGradingStrategy implements GradingStrategy {

    private final OpenAIService openAIService;
    private final ConfidenceCalculator confidenceCalculator;

    // Optional dependency: chỉ có khi LangChain4j được cấu hình thành công
    @Autowired(required = false)
    private com.igcse.ai.service.llm.LangChainConfidenceEvaluator langChainEvaluator;

    @Autowired
    public EssayGradingStrategy(OpenAIService openAIService, ConfidenceCalculator confidenceCalculator) {
        this.openAIService = openAIService;
        this.confidenceCalculator = confidenceCalculator;
    }

    @Override
    public GradingResult grade(AnswerDTO answer, String language) {
        if (!(answer instanceof EssayAnswer)) {
            throw new IllegalArgumentException("Answer is not Essay");
        }

        EssayAnswer essayAnswer = (EssayAnswer) answer;

        // Gọi OpenAI Service để chấm điểm với ngôn ngữ chỉ định
        Map<String, Object> aiResult = openAIService.gradeEssayAnswer(essayAnswer, language);

        Double score = ((Number) aiResult.get("score")).doubleValue();
        String feedback = (String) aiResult.get("feedback");
        boolean usedOpenAI = aiResult.containsKey("usedOpenAI") && (boolean) aiResult.get("usedOpenAI");
        Double maxScore = essayAnswer.getMaxScore() != null ? essayAnswer.getMaxScore() : 10.0;

        // Đảm bảo score không vượt quá maxScore
        score = Math.min(score, maxScore);
        score = Math.max(score, 0.0);

        // Tính confidence score
        // 1. Thử dùng LangChain4j (nếu có bean và sử dụng OpenAI)
        double confidence = 0.0;
        boolean confidenceCalculated = false;

        if (langChainEvaluator != null && usedOpenAI) {
            try {
                com.igcse.ai.dto.ConfidenceEvaluationResult evalResult = langChainEvaluator.evaluate(
                        essayAnswer.getStudentAnswer(),
                        essayAnswer.getReferenceAnswer(),
                        score,
                        maxScore);
                confidence = evalResult.confidenceScore();
                // Có thể append lý do vào feedback nếu muốn:
                // feedback += "\n\nConfidence Analysis: " + evalResult.reasoning();
                confidenceCalculated = true;
                System.out.println("LangChain evaluation SUCCESS. Confidence: " + confidence);
            } catch (Exception e) {
                // Log error but continue with fallback
                System.err.println("LangChain evaluator failed: " + e.getMessage());
                e.printStackTrace();
            }
        }

        // 2. Fallback to ConfidenceCalculator if LangChain not available
        if (!confidenceCalculated) {
            confidence = confidenceCalculator.calculateEssayConfidence(essayAnswer, score, usedOpenAI);
        }

        // Set evaluationMethod based on usedOpenAI flag
        String evaluationMethod = "LOCAL_RULE_BASED";
        if (usedOpenAI) {
        if (confidenceCalculated) {
            evaluationMethod = "AI_GPT4_LANGCHAIN";
            } else {
                evaluationMethod = "AI_GPT4";
            }
        }

        return new GradingResult(
                answer.getQuestionId(),
                "ESSAY",
                score,
                maxScore,
                feedback,
                score >= maxScore * 0.5, // Coi là đúng nếu >= 50% điểm
                confidence,
                evaluationMethod);
    }

    @Override
    public boolean supports(String answerType) {
        return "ESSAY".equalsIgnoreCase(answerType);
    }
}
