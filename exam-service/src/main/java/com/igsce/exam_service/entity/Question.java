package com.igsce.exam_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import com.igsce.exam_service.enums.*;

import java.util.ArrayList;

@Entity
@Table(name = "questions")
@Data
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long questionId;

    @Column(columnDefinition = "TEXT")
    private String content;

    private double score;
    private int orderIndex;

    @Enumerated(EnumType.STRING)
    private QuestionType questionType; // MCQ hoặc ESSAY

    // Chỉ dùng cho Tự luận (Đáp án tham khảo cho giáo viên)
    @Column(columnDefinition = "TEXT")
    private String essayCorrectAnswer;

    @Column(name = "image", columnDefinition = "LONGTEXT")
    private String image;

    @ManyToOne
    @JoinColumn(name = "exam_id")
    @JsonIgnoreProperties("questions")
    private Exam exam;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<QuestionOption> options = new ArrayList<>();

}
