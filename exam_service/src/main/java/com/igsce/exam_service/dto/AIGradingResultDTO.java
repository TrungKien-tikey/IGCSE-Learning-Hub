package com.igsce.exam_service.dto;

import lombok.Data;

/**
 * DTO để lấy kết quả chấm điểm từ AI Service
 * Tương ứng với dữ liệu trong ai_db.ai_results
 */
@Data
public class AIGradingResultDTO {
    
    /**
     * attempt_id - ID lượt làm bài
     */
    private Long attemptId;
    
    /**
     * score - Điểm số (0-10)
     */
    private Double score;
    
    /**
     * feedback - Nhận xét tổng quát từ AI
     */
    private String feedback;
    
    /**
     * language - Ngôn ngữ của feedback (en, vi)
     */
    private String language;
    
    /**
     * confidence - Độ tin cậy của điểm số (0.0-1.0)
     */
    private Double confidence;
    
    /**
     * confidenceLevel - Mức độ tin cậy (HIGH, MEDIUM, LOW)
     */
    private String confidenceLevel;
    
    /**
     * evaluationMethod - Phương pháp chấm (AI_GPT4_LANGCHAIN, LOCAL_RULE_BASED)
     */
    private String evaluationMethod;
    
    /**
     * gradedAt - Thời gian chấm điểm
     */
    private Object gradedAt; // Có thể là Date, String, hoặc Long timestamp
}






