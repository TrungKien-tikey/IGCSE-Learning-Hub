package com.igcse.ai.entity;

import java.util.Date;

/**
 * Lớp ExamAttempt đại diện cho một bài làm của học sinh
 * được gửi từ Exam Service sang AI Service để chấm điểm
 * 
 * LƯU Ý: Đây là DTO, KHÔNG phải Entity để lưu vào database.
 * Dữ liệu exam_attempts chỉ nên có trong exam_db, không phải ai_db.
 * AI Service chỉ lấy dữ liệu qua REST API, không lưu vào database.
 */
public class ExamAttempt {

    private Long attemptId;
    private Long examId;
    private Long studentId;
    private Date submittedAt;
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

