package com.igsce.exam_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.*;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.igsce.exam_service.enums.GradingStatus;

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
    private LocalDateTime submittedAt; // Thời điểm nộp bài
    private double totalScore;

    @Enumerated(EnumType.STRING)
    private GradingStatus gradingStatus = GradingStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String teacherGeneralFeedback;

    @ManyToOne
    @JoinColumn(name = "exam_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("questions")
    private Exam exam;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("attempt")
    private List<Answer> answers;

    public void submit() {
        this.submittedAt = LocalDateTime.now();
        // Mặc định nếu chưa chấm xong thì để PENDING
        if (this.gradingStatus == null) {
            this.gradingStatus = GradingStatus.PENDING;
        }
    }

    public double calculateScore() {
        return answers.stream()
                .mapToDouble(Answer::getScore)
                .sum();
    }

    public void recalculateTotalScore() {
        if (this.answers == null) {
            this.totalScore = 0;
            return;
        }
        this.totalScore = this.answers.stream()
                .mapToDouble(Answer::getScore) // Lấy điểm chốt (final score)
                .sum();
    }
}
