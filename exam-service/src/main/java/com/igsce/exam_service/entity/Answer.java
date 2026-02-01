package com.igsce.exam_service.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "exam_answers")
@Data
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long answerId;

    @ManyToOne
    @JoinColumn(name = "attempt_id")
    @JsonBackReference
    private ExamAttempt attempt;

    @ManyToOne
    @JoinColumn(name = "question_id")
    @JsonIgnoreProperties("answers")
    private Question question;

    // Nếu là Trắc nghiệm -> Lưu ID của option đã chọn
    private Long selectedOptionId;

    // Nếu là Tự luận -> Lưu văn bản sinh viên viết
    @Column(columnDefinition = "TEXT")
    private String textAnswer;

    private double score; // Điểm đạt được của câu này

    @Column(columnDefinition = "TEXT")
    private String feedback; // Nhận xét/feedback cho câu trả lời

    private Double aiScore;

    @Column(columnDefinition = "TEXT")
    private String aiFeedback;

    @Column(columnDefinition = "TEXT")
    private String teacherFeedback; // <--- Trường này phải tồn tại

    @Column(nullable = false)
    private boolean isManuallyGraded = false;

    public void applyAiGrading(double score, String feedback) {
        this.aiScore = score;
        this.aiFeedback = feedback;

        // Mặc định ban đầu: Điểm chính thức = Điểm AI
        this.score = score;
        this.feedback = feedback;
        this.isManuallyGraded = false;
    }

    public void applyTeacherGrading(double newScore, String newFeedback) {
        this.score = newScore;
        this.feedback = newFeedback; // <-- Feedback chính thức (hiện cho HS)

        this.teacherFeedback = newFeedback; // <-- [QUAN TRỌNG] Lưu riêng vào field teacherFeedback
        this.isManuallyGraded = true;
    }

}
