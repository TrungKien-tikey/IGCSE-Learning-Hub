package com.igsce.exam_service.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * DTO cho câu trả lời tự luận
 * Copy từ AI Service để đảm bảo tính độc lập (Decoupling)
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class EssayAnswer extends AnswerDTO {
    private String studentAnswer; // Câu trả lời của học sinh
    private String questionText; // Nội dung câu hỏi
    private String referenceAnswer; // Đáp án tham khảo (nếu có)
    private Double maxScore; // Điểm tối đa cho câu này

    public EssayAnswer() {
        this.type = "ESSAY";
    }

    public EssayAnswer(Long questionId, String studentAnswer, String questionText,
            String referenceAnswer, Double maxScore) {
        this();
        this.questionId = questionId;
        this.studentAnswer = studentAnswer;
        this.questionText = questionText;
        this.referenceAnswer = referenceAnswer;
        this.maxScore = maxScore;
    }
}
