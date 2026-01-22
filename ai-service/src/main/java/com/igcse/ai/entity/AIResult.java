package com.igcse.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * Lớp AIResult lưu trữ kết quả chấm điểm do AI Service tạo ra
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ai_results", indexes = {
        @Index(name = "idx_class_id", columnList = "class_id"),
        @Index(name = "idx_student_id", columnList = "student_id"),
        @Index(name = "idx_exam_id", columnList = "exam_id"),
        @Index(name = "idx_attempt_id", columnList = "attempt_id"),
        @Index(name = "idx_graded_at", columnList = "graded_at")
})
public class AIResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long resultId;

    @Column(nullable = false, unique = true)
    private Long attemptId;

    @Column(nullable = false)
    private Double score;

    @Column(columnDefinition = "TEXT")
    private String feedback; // Nhận xét từ hệ thống AI

    @Column(nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date gradedAt;

    @Column
    private String language; // "en" hoặc "vi"

    @Column
    private Double confidence; // Độ tin cậy của điểm số (0.0 - 1.0)

    @Column
    private Long studentId; // ID học sinh

    @Column(name = "student_name")
    private String studentName;

    @Column
    private Long examId; // ID bài thi

    @Column
    private Long classId; // ID lớp học

    @Column(columnDefinition = "TEXT")
    private String details; // JSON chi tiết kết quả chấm từng câu

    @Column
    private String evaluationMethod; // "AI_GPT4_LANGCHAIN" hoặc "LOCAL_RULE_BASED"

    @Column(name = "answers_hash", length = 64)
    private String answersHash; // MD5 hash của answers JSON để validate cache

    @Column(name = "multiple_choice_score")
    private Double multipleChoiceScore; // Điểm phần trắc nghiệm

    @Column(name = "essay_score")
    private Double essayScore; // Điểm phần tự luận

    public AIResult(Long attemptId, Double score, String feedback) {
        this.attemptId = attemptId;
        this.score = score;
        this.feedback = feedback;
        this.gradedAt = new Date();
        this.language = "en";
        this.confidence = 1.0;
    }

    public AIResult(Long attemptId, Double score, String feedback, String language, Double confidence) {
        this.attemptId = attemptId;
        this.score = score;
        this.feedback = feedback;
        this.gradedAt = new Date();
        this.language = language;
        this.confidence = confidence;
    }

    /**
     * Lấy mức độ tin cậy dưới dạng text
     */
    public String getConfidenceLevel() {
        if (confidence == null)
            return "UNKNOWN";
        if (confidence >= 0.8)
            return "HIGH";
        if (confidence >= 0.5)
            return "MEDIUM";
        return "LOW";
    }

    /**
     * Kiểm tra học sinh có đạt hay không
     * 
     * @return boolean - true nếu điểm >= 5.0, false nếu không
     */
    public boolean isPassed() {
        return score != null && score >= 5.0;
    }
}
