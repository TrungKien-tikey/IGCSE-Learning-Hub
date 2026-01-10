package com.igcse.ai.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;

@Entity
@Table(name = "ai_pre_analysis")
@Data
public class AIPreAnalysis {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pre_analysis_id")
    private Long preAnalysisId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "exam_count_since_last_ai")
    private Integer examCountSinceLastAi;

    @Column(name = "logic_feedback", columnDefinition = "TEXT")
    private String logicFeedback;

    @Column(name = "avg_score")
    private Double avgScore;

    @Column(name = "key_strengths", columnDefinition = "TEXT")
    private String keyStrengths; // JSON array

    @Column(name = "key_weaknesses", columnDefinition = "TEXT")
    private String keyWeaknesses; // JSON array

    @Column(name = "generated_at", nullable = false, updatable = false)
    private Date generatedAt;

    @PrePersist
    protected void onCreate() {
        generatedAt = new Date();
        if (examCountSinceLastAi == null)
            examCountSinceLastAi = 1;
    }
}
