package com.igsce.exam_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.*;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

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
    @JsonIgnoreProperties({"exam", "options"})
    private Question question;

    // Nếu là Trắc nghiệm -> Lưu ID của option đã chọn
    private Long selectedOptionId; 

    // Nếu là Tự luận -> Lưu văn bản sinh viên viết
    @Column(name = "text_answer", columnDefinition = "TEXT")
    private String textAnswer;

    private double score; // Điểm đạt được của câu này

}
