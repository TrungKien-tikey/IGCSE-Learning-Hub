package com.igcse.ai.dto;

/**
 * DTO cho câu trả lời tự luận
 */
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

    public String getStudentAnswer() {
        return studentAnswer;
    }

    public void setStudentAnswer(String studentAnswer) {
        this.studentAnswer = studentAnswer;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getReferenceAnswer() {
        return referenceAnswer;
    }

    public void setReferenceAnswer(String referenceAnswer) {
        this.referenceAnswer = referenceAnswer;
    }

    public Double getMaxScore() {
        return maxScore;
    }

    public void setMaxScore(Double maxScore) {
        this.maxScore = maxScore;
    }
}
