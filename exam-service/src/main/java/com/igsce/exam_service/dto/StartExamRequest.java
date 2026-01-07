package com.igsce.exam_service.dto;

import lombok.*;

@Data
public class StartExamRequest {
    private Long examId;
    private Long userId;
}
