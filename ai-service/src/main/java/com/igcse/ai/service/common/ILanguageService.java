package com.igcse.ai.service.common;

public interface ILanguageService {
    String normalizeLanguage(String language);

    String getSystemPrompt(String language);

    String getFeedbackByPercentage(String language, double percentage);

    String getNoResultMessage(String language);

    String getTotalScoreFormat(String language, double totalScore, double maxScore, double percentage);

    String getDetailHeader(String language);

    String getAiLanguageName(String language);
}
