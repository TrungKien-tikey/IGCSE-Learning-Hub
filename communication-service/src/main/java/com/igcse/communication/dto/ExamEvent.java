package com.igcse.communication.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExamEvent {
    private Long examId;
    private String examTitle;
    private Long courseId;
}