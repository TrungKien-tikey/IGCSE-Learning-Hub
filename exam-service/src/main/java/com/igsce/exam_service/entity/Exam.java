package com.igsce.exam_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.*;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

@Entity
@Table(name = "exams")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long examId;

    private String title;
    private String description;
    private int duration;

    private LocalDateTime endTime;

    @JsonProperty("isActive")
    private boolean isActive;

    @Column(name = "is_strict") 
    @JsonProperty("isStrict")
    private Boolean isStrict = false;

    private int maxAttempts = 1; // Số lần làm bài tối đa, mặc định là 1

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference 
    private List<Question> questions = new ArrayList<>();

    public void updateExam(String title, String description, int duration) {
        this.title = title;
        this.description = description;
        this.duration = duration;
    }

    public void deactivate() {
        this.isActive = false;
    }

   
    public boolean isActive() {
        return isActive;
    }

    public String getTitle() {
        return this.title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

}
