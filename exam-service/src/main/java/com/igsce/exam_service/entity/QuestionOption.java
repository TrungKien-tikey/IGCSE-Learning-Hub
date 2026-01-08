package com.igsce.exam_service.entity;

import jakarta.persistence.*;
import lombok.*;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "question_options")
@Data
public class QuestionOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long optionId;

    private String content; // Ví dụ: "Hà Nội", "Đà Nẵng"
    
    @JsonProperty("isCorrect")
    private boolean isCorrect; // true nếu đây là đáp án đúng

    @ManyToOne
    @JoinColumn(name = "question_id")
    @JsonBackReference  // <--- 1. CẮT VÒNG LẶP JSON TỪ CON -> CHA
    @ToString.Exclude   // <--- 2. CẮT VÒNG LẶP TOSTRING CỦA LOMBOK
    private Question question;
}
