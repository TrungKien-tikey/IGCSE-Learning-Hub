package com.igcse.ai.dto.aiChamDiem;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO cho kết quả chấm điểm chi tiết với danh sách từng câu
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetailedGradingResultDTO {
    private Long attemptId;
    private Double score;
    private Double maxScore;
    private String feedback;
    private Double confidence;
    private String language;
    private List<GradingResult> details;
}
