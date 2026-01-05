package com.igcse.ai.entity;

import jakarta.persistence.*;
import java.util.Date;

/**
 * Lớp ExamAttempt đại diện cho một bài làm của học sinh
 * được gửi từ Exam Service sang AI Service để chấm điểm
 */
@Entity
@Table(name = "exam_attempts")
public class ExamAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long attemptId;

    @Column(nullable = false)
    private Long examId;

    @Column(nullable = false)
    private Long studentId;

    @Column(nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date submittedAt;

    @Column(columnDefinition = "TEXT")
    private String answers; // Lưu câu trả lời dưới dạng JSON string

    // ===== Constructor =====
    public ExamAttempt() {}

    public ExamAttempt(Long examId, Long studentId, String answers) {
        this.examId = examId;
        this.studentId = studentId;
        this.answers = answers;
        this.submittedAt = new Date();
    }

    // ===== Getter & Setter =====
    public Long getAttemptId() {
        return attemptId;
    }

    public void setAttemptId(Long attemptId) {
        this.attemptId = attemptId;
    }

    public Long getExamId() {
        return examId;
    }

    public void setExamId(Long examId) {
        this.examId = examId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Date getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Date submittedAt) {
        this.submittedAt = submittedAt;
    }

    /**
     * Lấy danh sách câu trả lời của học sinh
     * @return string - Câu trả lời dưới dạng JSON string
     */
    public String getAnswers() {
        return answers;
    }

    public void setAnswers(String answers) {
        this.answers = answers;
    }
}

