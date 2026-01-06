package com.igcse.communication.dto;
import lombok.Data;

@Data
public class ExamCreatedEvent {
    private Long examId;
    private Long courseId;
    private String examTitle;
    private String action; // "CREATED"
}