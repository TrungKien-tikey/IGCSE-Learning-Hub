package com.igcse.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ai_recommendations")
public class AIRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recommendation_id")
    private Long recommendationId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "weak_topics", columnDefinition = "TEXT")
    private String weakTopics; // JSON array

    @Column(name = "strong_topics", columnDefinition = "TEXT")
    private String strongTopics; // JSON array

    @Column(name = "recommended_resources", columnDefinition = "TEXT")
    private String recommendedResources; // JSON array

    @Column(name = "learning_path_suggestion", columnDefinition = "TEXT")
    private String learningPathSuggestion;

    @Column(name = "language", length = 10)
    private String language;

    @Column(name = "is_ai_generated")
    private Boolean isAiGenerated;

    @Column(name = "generated_at", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date generatedAt;

    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;

    // // Constructors
    // public AIRecommendation() {
    //     this.generatedAt = new Date();
    //     this.updatedAt = new Date();
    //     this.language = "vi";
    //     this.isAiGenerated = true;
    // }

    // // Getters and Setters
    // public Long getRecommendationId() {
    //     return recommendationId;
    // }

    // public void setRecommendationId(Long recommendationId) {
    //     this.recommendationId = recommendationId;
    // }

    // public Long getStudentId() {
    //     return studentId;
    // }

    // public void setStudentId(Long studentId) {
    //     this.studentId = studentId;
    // }

    // public String getWeakTopics() {
    //     return weakTopics;
    // }

    // public void setWeakTopics(String weakTopics) {
    //     this.weakTopics = weakTopics;
    // }

    // public String getStrongTopics() {
    //     return strongTopics;
    // }

    // public void setStrongTopics(String strongTopics) {
    //     this.strongTopics = strongTopics;
    // }

    // public String getRecommendedResources() {
    //     return recommendedResources;
    // }

    // public void setRecommendedResources(String recommendedResources) {
    //     this.recommendedResources = recommendedResources;
    // }

    // public String getLearningPathSuggestion() {
    //     return learningPathSuggestion;
    // }

    // public void setLearningPathSuggestion(String learningPathSuggestion) {
    //     this.learningPathSuggestion = learningPathSuggestion;
    // }

    // public String getLanguage() {
    //     return language;
    // }

    // public void setLanguage(String language) {
    //     this.language = language;
    // }

    // public Boolean getIsAiGenerated() {
    //     return isAiGenerated;
    // }

    // public void setIsAiGenerated(Boolean isAiGenerated) {
    //     this.isAiGenerated = isAiGenerated;
    // }

    // public Date getGeneratedAt() {
    //     return generatedAt;
    // }

    // public void setGeneratedAt(Date generatedAt) {
    //     this.generatedAt = generatedAt;
    // }

    // public Date getUpdatedAt() {
    //     return updatedAt;
    // }

    // public void setUpdatedAt(Date updatedAt) {
    //     this.updatedAt = updatedAt;
    // }
}