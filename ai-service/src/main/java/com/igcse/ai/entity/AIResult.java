package com.igcse.ai.entity;

import jakarta.persistence.*;
import java.util.Date;

/**
 * Lớp AIResult lưu trữ kết quả chấm điểm do AI Service tạo ra
 */
@Entity
@Table(name = "ai_results")
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

    @Column
    private Long examId; // ID bài thi

    @Column(columnDefinition = "TEXT")
    private String details; // JSON chi tiết kết quả chấm từng câu

    @Column
    private String evaluationMethod; // "AI_GPT4_LANGCHAIN" hoặc "LOCAL_RULE_BASED"

    // ===== Constructor =====
    public AIResult() {
    }

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

    // ===== Getter & Setter =====
    public Long getResultId() {
        return resultId;
    }

    public void setResultId(Long resultId) {
        this.resultId = resultId;
    }

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

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public Date getGradedAt() {
        return gradedAt;
    }

    public void setGradedAt(Date gradedAt) {
        this.gradedAt = gradedAt;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Long getExamId() {
        return examId;
    }

    public void setExamId(Long examId) {
        this.examId = examId;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getEvaluationMethod() {
        return evaluationMethod;
    }

    public void setEvaluationMethod(String evaluationMethod) {
        this.evaluationMethod = evaluationMethod;
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
