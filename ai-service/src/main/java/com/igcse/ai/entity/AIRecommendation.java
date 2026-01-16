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

    @Column(name = "student_name")
    private String studentName;

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

    @Column(name = "total_exams_analyzed")
    private Integer totalExamsAnalyzed;

    @Column(name = "avg_score_analyzed")
    private Double avgScoreAnalyzed;

    @Column(name = "generated_at", nullable = false, updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date generatedAt;

    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;

    @PrePersist
    protected void onCreate() {
        Date now = new Date();
        this.generatedAt = now;
        this.updatedAt = now;
        if (this.isAiGenerated == null)
            this.isAiGenerated = true;
        if (this.language == null)
            this.language = "vi";
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = new Date();
    }

}