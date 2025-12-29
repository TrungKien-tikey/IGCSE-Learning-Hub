package com.igsce.exam_service.dto;

import lombok.Data;

@Data
public class AnswerScoreDTO {
    private Long questionId;
    private Double score;
    private String feedback;
    private Double confidence;
}

