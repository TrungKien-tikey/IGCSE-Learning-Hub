package com.igcse.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Kết quả chấm điểm cho một câu hỏi
 */
public class GradingResult {
    private Long questionId;
    private String questionType; // MULTIPLE_CHOICE hoặc ESSAY
    private Double score; // Điểm đạt được
    private Double maxScore; // Điểm tối đa
    private String feedback; // Nhận xét cho câu này
    private boolean isCorrect; // Đúng/Sai (chủ yếu cho trắc nghiệm)
    private Double confidence; // Độ tin cậy của điểm số (0.0 - 1.0)
    private String evaluationMethod; // Phương pháp chấm: AI_GPT4_LANGCHAIN hoặc LOCAL_RULE_BASED

    public GradingResult() {
    }

    public GradingResult(Long questionId, String questionType, Double score,
            Double maxScore, String feedback, boolean isCorrect) {
        this.questionId = questionId;
        this.questionType = questionType;
        this.score = score;
        this.maxScore = maxScore;
        this.feedback = feedback;
        this.isCorrect = isCorrect;
        this.confidence = 1.0; // Default confidence
        this.evaluationMethod = "LOCAL_RULE_BASED"; // Default method
    }

    public GradingResult(Long questionId, String questionType, Double score,
            Double maxScore, String feedback, boolean isCorrect, Double confidence) {
        this.questionId = questionId;
        this.questionType = questionType;
        this.score = score;
        this.maxScore = maxScore;
        this.feedback = feedback;
        this.isCorrect = isCorrect;
        this.confidence = confidence;
        this.evaluationMethod = "LOCAL_RULE_BASED";
    }

    // Constructor full option
    public GradingResult(Long questionId, String questionType, Double score,
            Double maxScore, String feedback, boolean isCorrect, Double confidence, String evaluationMethod) {
        this.questionId = questionId;
        this.questionType = questionType;
        this.score = score;
        this.maxScore = maxScore;
        this.feedback = feedback;
        this.isCorrect = isCorrect;
        this.confidence = confidence;
        this.evaluationMethod = evaluationMethod;
    }

    // Getters and Setters
    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public String getQuestionType() {
        return questionType;
    }

    public void setQuestionType(String questionType) {
        this.questionType = questionType;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public Double getMaxScore() {
        return maxScore;
    }

    public void setMaxScore(Double maxScore) {
        this.maxScore = maxScore;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public boolean isCorrect() {
        return isCorrect;
    }

    public void setCorrect(boolean correct) {
        isCorrect = correct;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    @JsonIgnore
    public String getConfidenceLevel() {
        if (confidence == null)
            return "UNKNOWN";
        if (confidence >= 0.8)
            return "HIGH";
        if (confidence >= 0.5)
            return "MEDIUM";
        return "LOW";
    }

    public String getEvaluationMethod() {
        return evaluationMethod;
    }

    public void setEvaluationMethod(String evaluationMethod) {
        this.evaluationMethod = evaluationMethod;
    }
}
