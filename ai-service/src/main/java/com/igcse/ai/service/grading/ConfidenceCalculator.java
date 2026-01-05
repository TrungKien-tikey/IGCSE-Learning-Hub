package com.igcse.ai.service.grading;

import com.igcse.ai.dto.EssayAnswer;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * Component tính toán độ tin cậy (confidence) của điểm số
 */
@Component
public class ConfidenceCalculator {

    /**
     * Tính confidence cho câu trắc nghiệm
     * Luôn là 1.0 vì so sánh chính xác
     */
    public double calculateMultipleChoiceConfidence() {
        return 1.0;
    }

    /**
     * Tính confidence cho câu tự luận
     * 
     * @param answer     Câu trả lời của học sinh
     * @param score      Điểm đã chấm
     * @param usedOpenAI Có sử dụng OpenAI hay không
     * @return Confidence score (0.0 - 1.0)
     */
    public double calculateEssayConfidence(EssayAnswer answer, double score, boolean usedOpenAI) {
        if (answer == null || answer.getStudentAnswer() == null) {
            return 0.0;
        }

        // Factor 1: Độ dài câu trả lời (20%)
        double lengthFactor = calculateLengthFactor(answer.getStudentAnswer());

        // Factor 2: Keyword matching với reference answer (30%)
        double keywordFactor = calculateKeywordFactor(
                answer.getStudentAnswer(),
                answer.getReferenceAnswer());

        // Factor 3: OpenAI/Fallback confidence (50%)
        double aiFactor = usedOpenAI ? 0.9 : 0.5;

        // Tổng hợp
        double confidence = (lengthFactor * 0.2) +
                (keywordFactor * 0.3) +
                (aiFactor * 0.5);

        return Math.min(1.0, Math.max(0.0, confidence));
    }

    /**
     * Tính factor dựa trên độ dài câu trả lời
     */
    private double calculateLengthFactor(String answer) {
        if (answer == null)
            return 0.0;

        int length = answer.trim().length();
        if (length < 20)
            return 0.2;
        if (length < 50)
            return 0.4;
        if (length < 100)
            return 0.6;
        if (length < 200)
            return 0.8;
        return 1.0;
    }

    /**
     * Tính factor dựa trên keyword matching
     */
    private double calculateKeywordFactor(String studentAnswer, String referenceAnswer) {
        if (referenceAnswer == null || referenceAnswer.isEmpty()) {
            return 0.5; // Neutral nếu không có reference
        }
        if (studentAnswer == null || studentAnswer.isEmpty()) {
            return 0.0;
        }

        String studentLower = studentAnswer.toLowerCase();
        String[] refWords = referenceAnswer.toLowerCase().split("\\W+");

        // Đếm số từ có nghĩa match
        long matchCount = Arrays.stream(refWords)
                .filter(word -> word.length() > 3) // Bỏ qua từ ngắn
                .filter(word -> !isCommonWord(word)) // Bỏ qua từ phổ biến
                .filter(studentLower::contains)
                .count();

        long totalMeaningfulWords = Arrays.stream(refWords)
                .filter(word -> word.length() > 3)
                .filter(word -> !isCommonWord(word))
                .count();

        if (totalMeaningfulWords == 0)
            return 0.5;

        double matchRatio = (double) matchCount / totalMeaningfulWords;
        return Math.min(1.0, matchRatio * 1.3); // Scale up một chút
    }

    /**
     * Kiểm tra từ có phải là từ phổ biến không
     */
    private boolean isCommonWord(String word) {
        String[] commonWords = { "the", "and", "that", "this", "with", "from", "have", "are", "was", "were",
                "been", "being", "has", "had", "does", "did", "will", "would", "could", "should",
                "may", "might", "must", "shall", "can", "need", "dare", "used", "which", "when",
                "where", "what", "who", "whom", "whose", "why", "how", "then", "than", "into",
                "through", "about", "before", "after", "above", "below", "between", "under" };
        return Arrays.asList(commonWords).contains(word.toLowerCase());
    }

    /**
     * Tính confidence trung bình từ danh sách confidence
     */
    public double calculateAverageConfidence(double[] confidences) {
        if (confidences == null || confidences.length == 0) {
            return 0.0;
        }

        double sum = 0.0;
        for (double c : confidences) {
            sum += c;
        }
        return sum / confidences.length;
    }
}
