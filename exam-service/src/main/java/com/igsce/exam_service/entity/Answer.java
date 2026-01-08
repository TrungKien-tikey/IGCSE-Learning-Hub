package com.igsce.exam_service.entity;

import jakarta.persistence.*;
import lombok.*;


import com.fasterxml.jackson.annotation.JsonBackReference;


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
    private Question question;

    // Nếu là Trắc nghiệm -> Lưu ID của option đã chọn
    private Long selectedOptionId; 

    // Nếu là Tự luận -> Lưu văn bản sinh viên viết
    @Column(columnDefinition = "TEXT")
    private String textAnswer;

    private double score; // Điểm đạt được của câu này

}
