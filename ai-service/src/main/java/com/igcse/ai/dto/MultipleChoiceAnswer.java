package com.igcse.ai.dto;

/**
 * DTO cho câu trả lời trắc nghiệm
 */
public class MultipleChoiceAnswer extends AnswerDTO {
    private String selectedOption; // A, B, C, D
    private String correctOption; // Đáp án đúng từ Exam Service

    public MultipleChoiceAnswer() {
        this.type = "MULTIPLE_CHOICE";
    }

    public MultipleChoiceAnswer(Long questionId, String selectedOption, String correctOption) {
        this();
        this.questionId = questionId;
        this.selectedOption = selectedOption;
        this.correctOption = correctOption;
    }

    public String getSelectedOption() {
        return selectedOption;
    }

    public void setSelectedOption(String selectedOption) {
        this.selectedOption = selectedOption;
    }

    public String getCorrectOption() {
        return correctOption;
    }

    public void setCorrectOption(String correctOption) {
        this.correctOption = correctOption;
    }

    /**
     * Kiểm tra câu trả lời có đúng không
     */
    public boolean isCorrect() {
        return selectedOption != null &&
                correctOption != null &&
                selectedOption.trim().equalsIgnoreCase(correctOption.trim());
    }
}
