package com.igcse.ai.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ai_insights")
public class AIInsight {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "insight_id")
    private Long insightId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "overall_summary", columnDefinition = "TEXT")
    private String overallSummary;

    @Column(name = "key_strengths", columnDefinition = "TEXT")
    private String keyStrengths;

    @Column(name = "areas_for_improvement", columnDefinition = "TEXT")
    private String areasForImprovement;

    @Column(name = "action_plan", columnDefinition = "TEXT")
    private String actionPlan;

    @Column(name = "language", length = 10)
    private String language;

    @Column(name = "is_ai_generated", nullable = false)
    private Boolean isAiGenerated;

    @Column(name = "total_exams_analyzed")
    private Integer totalExamsAnalyzed;

    @Column(name = "avg_score_analyzed")
    private Double avgScoreAnalyzed;

    @Column(name = "generated_at", nullable = false, updatable = false)
    private Date generatedAt;

    @Column(name = "updated_at", nullable = false)
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
