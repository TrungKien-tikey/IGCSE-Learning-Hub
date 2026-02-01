package com.igcse.communication.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExamCreatedEvent {
    private Long examId;
    private String examTitle;
    private String description;
}