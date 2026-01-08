package com.igsce.exam_service.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class GradingResultCallbackDTO {
    private Long attemptId;
    private List<Map<String, Object>> answerScores;
    private Double totalScore;
    private String overallFeedback;
    private Double confidence;
}
