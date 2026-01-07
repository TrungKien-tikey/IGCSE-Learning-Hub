package com.igcse.ai.dto;

import java.util.List;

public class DetailedGradingResultDTO {
    private Long attemptId;
    private Double score;
    private Double maxScore;
    private String feedback;
    private Double confidence;
    private String language;
    private List<GradingResult> details;

    public DetailedGradingResultDTO() {
    }

    public DetailedGradingResultDTO(Long attemptId, Double score, Double maxScore,
            String feedback, Double confidence, String language,
            List<GradingResult> details) {
        this.attemptId = attemptId;
        this.score = score;
        this.maxScore = maxScore;
        this.feedback = feedback;
        this.confidence = confidence;
        this.language = language;
        this.details = details;
    }

    // Getters and Setters
    public Long getAttemptId() {
        return attemptId;
    }

    public void setAttemptId(Long attemptId) {
        this.attemptId = attemptId;
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

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public List<GradingResult> getDetails() {
        return details;
    }

    public void setDetails(List<GradingResult> details) {
        this.details = details;
    }
}
