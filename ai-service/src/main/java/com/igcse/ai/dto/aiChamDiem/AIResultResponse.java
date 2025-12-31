package com.igcse.ai.dto.aiChamDiem;

import com.igcse.ai.entity.AIResult;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * DTO cho response kết quả chấm điểm với confidence và language
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIResultResponse {
    private Long resultId;
    private Long attemptId;
    private Double score;
    private String feedback;
    private Date gradedAt;
    private boolean passed;
    private String language;
    private Double confidence;
    private String confidenceLevel;
    private String evaluationMethod;

    public AIResultResponse(AIResult result) {
        this.resultId = result.getResultId();
        this.attemptId = result.getAttemptId();
        this.score = result.getScore();
        this.feedback = result.getFeedback();
        this.gradedAt = result.getGradedAt();
        this.passed = result.isPassed();
        this.language = result.getLanguage();
        this.confidence = result.getConfidence();
        this.confidenceLevel = result.getConfidenceLevel();
        this.evaluationMethod = result.getEvaluationMethod();
    }
}

