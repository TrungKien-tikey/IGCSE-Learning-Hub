package com.igcse.ai.dto;

import java.util.List;

/**
 * Kết quả đánh giá độ tin cậy từ LangChain4j
 * 
 * @param confidenceScore Điểm độ tin cậy (0.0 - 1.0)
 * @param reasoning       Lý do đánh giá
 * @param strengths       Các điểm mạnh của đánh giá
 * @param weaknesses      Các điểm yếu hoặc rủi ro
 */
public record ConfidenceEvaluationResult(
        double confidenceScore,
        String reasoning,
        List<String> strengths,
        List<String> weaknesses) {
}
