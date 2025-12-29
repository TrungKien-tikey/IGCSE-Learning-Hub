package com.igcse.ai.service.aiChamDiem;

import com.igcse.ai.dto.aiChamDiem.AnswerDTO;
import com.igcse.ai.dto.aiChamDiem.GradingResult;

import java.util.List;

public interface IGradingService {
    List<GradingResult> gradeAllAnswers(String answersJson, String language);

    GradingResult gradeAnswer(AnswerDTO answer, String language);

    double calculateTotalScore(List<GradingResult> results);

    double calculateMaxScore(List<GradingResult> results);

    double calculateAverageConfidence(List<GradingResult> results);

    String generateOverallFeedback(List<GradingResult> results, String language);
}
