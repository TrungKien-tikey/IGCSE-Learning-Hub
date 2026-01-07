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
        if (selectedOption == null || correctOption == null) {
            return false;
        }
        // Chuẩn hóa câu trả lời: xóa khoảng trắng, chuyển về chữ hoa, và loại bỏ các ký tự không phải chữ/số.
        String normalizedSelected = selectedOption.trim().toUpperCase().replaceAll("[^A-Z0-9]", "");
        String normalizedCorrect = correctOption.trim().toUpperCase().replaceAll("[^A-Z0-9]", "");

        return normalizedSelected.equals(normalizedCorrect);
    }
}
