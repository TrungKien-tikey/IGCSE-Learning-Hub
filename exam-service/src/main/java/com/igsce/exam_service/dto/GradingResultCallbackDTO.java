package com.igsce.exam_service.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class GradingResultCallbackDTO {
    private Long attemptId;

    @com.fasterxml.jackson.annotation.JsonProperty("details")
    private List<Map<String, Object>> answerScores;

    @com.fasterxml.jackson.annotation.JsonProperty("score")
    private Double totalScore;

    @com.fasterxml.jackson.annotation.JsonProperty("feedback")
    private String overallFeedback;

    private Double confidence;
}
