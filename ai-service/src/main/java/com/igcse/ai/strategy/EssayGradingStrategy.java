package com.igcse.ai.strategy;

import com.igcse.ai.dto.aiChamDiem.AnswerDTO;
import com.igcse.ai.dto.aiChamDiem.EssayAnswer;
import com.igcse.ai.dto.aiChamDiem.GradingResult;

import org.springframework.stereotype.Component;

@Component
public class EssayGradingStrategy implements GradingStrategy {

    private final com.igcse.ai.service.llm.EssayGradingAiService essayGradingAiService;
    private final com.igcse.ai.service.common.ILanguageService languageService;

    public EssayGradingStrategy(
            com.igcse.ai.service.llm.EssayGradingAiService essayGradingAiService,
            com.igcse.ai.service.common.ILanguageService languageService) {
        this.essayGradingAiService = essayGradingAiService;
        this.languageService = languageService;
    }

    @Override
    public GradingResult grade(AnswerDTO answer, String language) {
        if (!(answer instanceof EssayAnswer)) {
            throw new IllegalArgumentException("Answer is not Essay");
        }

        EssayAnswer essayAnswer = (EssayAnswer) answer;

        // Default values to avoid AI errors
        String question = essayAnswer.getQuestionText() != null ? essayAnswer.getQuestionText()
                : "No question provided";
        String reference = essayAnswer.getReferenceAnswer() != null ? essayAnswer.getReferenceAnswer()
                : "No reference answer provided";
        String studentAnswer = essayAnswer.getStudentAnswer() != null ? essayAnswer.getStudentAnswer()
                : "No answer provided";
        double maxScore = essayAnswer.getMaxScore() != null ? essayAnswer.getMaxScore() : 10.0;
        String lang = language != null ? language : "English";

        try {
            // Lấy tên ngôn ngữ đầy đủ cho AI (ví dụ: "Vietnamese", "English")
            String aiLanguageName = languageService.getAiLanguageName(lang);

            // Call LangChain4j AI Service
            com.igcse.ai.service.llm.EssayGradeResult result = essayGradingAiService.gradeEssay(
                    question,
                    maxScore,
                    reference,
                    studentAnswer,
                    aiLanguageName);

            // Output logic
            return new GradingResult(
                    answer.getQuestionId(),
                    "ESSAY",
                    result.getScore(),
                    maxScore,
                    result.getFeedback(),
                    result.getScore() >= maxScore * 0.5,
                    result.getConfidenceScore(),
                    "AI_GPT4_LANGCHAIN");

        } catch (Exception e) {
            e.printStackTrace();
            // Fallback in case of AI failure
            return new GradingResult(
                    answer.getQuestionId(),
                    "ESSAY",
                    0.0,
                    maxScore,
                    "AI Grading failed: " + e.getMessage() + ". Please manually review.",
                    false,
                    0.0,
                    "ERROR_FALLBACK");
        }
    }

    @Override
    public boolean supports(String answerType) {
        return "ESSAY".equalsIgnoreCase(answerType);
    }
}
