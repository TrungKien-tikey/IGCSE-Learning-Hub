package com.igcse.ai.dto.aiChamDiem;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Kết quả chấm điểm cho một câu hỏi
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GradingResult {
    private Long questionId;
    private String questionType; // MULTIPLE_CHOICE hoặc ESSAY
    private Double score; // Điểm đạt được
    private Double maxScore; // Điểm tối đa
    private String feedback; // Nhận xét cho câu này
    private boolean isCorrect; // Đúng/Sai (chủ yếu cho trắc nghiệm)
    private Double confidence; // Độ tin cậy của điểm số (0.0 - 1.0)
    private String evaluationMethod; // Phương pháp chấm: AI_GPT4_LANGCHAIN hoặc LOCAL_RULE_BASED

    public GradingResult(Long questionId, String questionType, Double score,
            Double maxScore, String feedback, boolean isCorrect) {
        this.questionId = questionId;
        this.questionType = questionType;
        this.score = score;
        this.maxScore = maxScore;
        this.feedback = feedback;
        this.isCorrect = isCorrect;
        this.confidence = 1.0; // Default confidence
        this.evaluationMethod = "LOCAL_RULE_BASED"; // Default method
    }

    public GradingResult(Long questionId, String questionType, Double score,
            Double maxScore, String feedback, boolean isCorrect, Double confidence) {
        this.questionId = questionId;
        this.questionType = questionType;
        this.score = score;
        this.maxScore = maxScore;
        this.feedback = feedback;
        this.isCorrect = isCorrect;
        this.confidence = confidence;
        this.evaluationMethod = "LOCAL_RULE_BASED";
    }

    @JsonIgnore
    public String getConfidenceLevel() {
        if (confidence == null)
            return "UNKNOWN";
        if (confidence >= 0.8)
            return "HIGH";
        if (confidence >= 0.5)
            return "MEDIUM";
        return "LOW";
    }
}
