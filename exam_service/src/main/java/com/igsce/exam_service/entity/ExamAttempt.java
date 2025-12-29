package com.igsce.exam_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.*;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

@Entity
@Table(name = "exam_attempts")
@Data
public class ExamAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long attemptId;

    private Long userId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private double totalScore;

    @ManyToOne
    @JoinColumn(name = "exam_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Exam exam;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("attempt")
    private List<Answer> answers;

    public void submit() {
        this.endTime = LocalDateTime.now();
    }

    public double calculateScore() {
        return answers.stream()
                .mapToDouble(Answer::getScore)
                .sum();
    }
}
