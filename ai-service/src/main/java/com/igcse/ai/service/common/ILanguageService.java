package com.igcse.ai.service.common;

public interface ILanguageService {
    String normalizeLanguage(String language);

    String getSystemPrompt(String language);

    String getFeedbackByPercentage(String language, double percentage);

    String getCorrectAnswerFeedback(String language);

    String getWrongAnswerFeedback(String language, String correctOption);

    String getNoResultMessage(String language);

    String getTotalScoreFormat(String language, double totalScore, double maxScore, double percentage);

    String getCorrectCountFormat(String language, long correctCount, int total);

    String getDetailHeader(String language);
}
