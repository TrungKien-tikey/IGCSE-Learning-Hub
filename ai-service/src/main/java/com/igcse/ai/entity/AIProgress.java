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
@Table(name = "ai_learning_progress")
public class AIProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "progress_id")
    private Long progressId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "score_change")
    private Double scoreChange;

    @Column(name = "trend_status")
    private String trendStatus;

    @Column(name = "mastered_topics", columnDefinition = "TEXT")
    private String masteredTopics; // JSON array

    @Column(name = "persistent_weaknesses", columnDefinition = "TEXT")
    private String persistentWeaknesses; // JSON array

    @Column(name = "trend_summary", columnDefinition = "TEXT")
    private String trendSummary;

    @Column(name = "generated_at", nullable = false, updatable = false)
    private Date generatedAt;

    @PrePersist
    protected void onCreate() {
        this.generatedAt = new Date();
        if (this.trendStatus == null)
            this.trendStatus = "STABLE";
        if (this.scoreChange == null)
            this.scoreChange = 0.0;
    }
}
