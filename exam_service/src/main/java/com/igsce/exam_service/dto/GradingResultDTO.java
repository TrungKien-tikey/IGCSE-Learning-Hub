package com.igsce.exam_service.dto;

import lombok.Data;
import java.util.List;

@Data
public class GradingResultDTO {
    private Long attemptId;
    private List<AnswerScoreDTO> answerScores;
    private Double totalScore;
    private String overallFeedback;
    private Double confidence;
}

