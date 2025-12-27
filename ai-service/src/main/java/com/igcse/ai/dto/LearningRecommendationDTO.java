package com.igcse.ai.dto;

import java.util.List;

public class LearningRecommendationDTO {
    private Long studentId;
    private List<String> weakTopics;
    private List<String> strongTopics;
    private List<String> recommendedResources;
    private String learningPathSuggestion;

    // Getters and Setters
    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public List<String> getWeakTopics() {
        return weakTopics;
    }

    public void setWeakTopics(List<String> weakTopics) {
        this.weakTopics = weakTopics;
    }

    public List<String> getStrongTopics() {
        return strongTopics;
    }

    public void setStrongTopics(List<String> strongTopics) {
        this.strongTopics = strongTopics;
    }

    public List<String> getRecommendedResources() {
        return recommendedResources;
    }

    public void setRecommendedResources(List<String> recommendedResources) {
        this.recommendedResources = recommendedResources;
    }

    public String getLearningPathSuggestion() {
        return learningPathSuggestion;
    }

    public void setLearningPathSuggestion(String learningPathSuggestion) {
        this.learningPathSuggestion = learningPathSuggestion;
    }
}
