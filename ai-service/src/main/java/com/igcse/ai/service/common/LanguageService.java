package com.igcse.ai.service.common;

import org.springframework.stereotype.Service;

/**
 * Service quản lý đa ngôn ngữ cho AI Service
 * Hỗ trợ tiếng Anh (en) và tiếng Việt (vi)
 */
@Service
public class LanguageService implements ILanguageService {

    public static final String ENGLISH = "en";
    public static final String VIETNAMESE = "vi";
    public static final String AUTO = "auto";
    public static final String DEFAULT_LANGUAGE = AUTO;

    /**
     * Lấy system prompt cho OpenAI theo ngôn ngữ
     */
    public String getSystemPrompt(String language) {
        if (VIETNAMESE.equals(language)) {
            return "Bạn là một giám khảo IGCSE có kinh nghiệm. " +
                    "Chấm điểm câu trả lời của học sinh một cách chính xác " +
                    "và đưa ra phản hồi mang tính xây dựng bằng tiếng Việt.";
        }
        if (AUTO.equals(language)) {
            return "You are an experienced IGCSE examiner. " +
                    "Please detect the language used by the student in their answer. " +
                    "Grade the answer accurately and provide constructive feedback in that SAME language.";
        }
        return "You are an experienced IGCSE examiner. " +
                "Grade student answers accurately and provide constructive feedback in English.";
    }

    /**
     * Lấy feedback template theo ngôn ngữ và phần trăm điểm
     */
    public String getFeedbackByPercentage(String language, double percentage) {
        if (VIETNAMESE.equals(language)) {
            if (percentage >= 80)
                return "Xuất sắc! Bạn đã nắm vững kiến thức.";
            if (percentage >= 60)
                return "Tốt! Bạn đã hiểu phần lớn nội dung.";
            if (percentage >= 50)
                return "Đạt yêu cầu. Hãy ôn tập thêm để cải thiện.";
            return "Chưa đạt yêu cầu. Cần ôn tập lại kiến thức.";
        }
        // English
        if (percentage >= 80)
            return "Excellent! You have mastered the knowledge.";
        if (percentage >= 60)
            return "Good! You understood most of the content.";
        if (percentage >= 50)
            return "Pass. Review more to improve.";
        return "Not pass. Need to review the knowledge.";
    }

    /**
     * Lấy feedback cho câu trắc nghiệm đúng
     */
    public String getCorrectAnswerFeedback(String language) {
        if (VIETNAMESE.equals(language)) {
            return "Chính xác! Bạn đã chọn đáp án đúng.";
        }
        return "Correct! You selected the right answer.";
    }

    /**
     * Lấy feedback cho câu trắc nghiệm sai
     */
    public String getWrongAnswerFeedback(String language, String correctOption) {
        if (VIETNAMESE.equals(language)) {
            return "Sai rồi. Đáp án đúng là " + correctOption + ". Hãy xem lại kiến thức này.";
        }
        return "Wrong. The correct answer is " + correctOption + ". Please review this topic.";
    }

    /**
     * Lấy thông báo không có kết quả
     */
    public String getNoResultMessage(String language) {
        if (VIETNAMESE.equals(language)) {
            return "Chưa có kết quả chấm điểm.";
        }
        return "No grading result available.";
    }

    /**
     * Lấy format tổng điểm
     */
    public String getTotalScoreFormat(String language, double totalScore, double maxScore, double percentage) {
        if (VIETNAMESE.equals(language)) {
            return String.format("Tổng điểm: %.2f / %.2f (%.1f%%)", totalScore, maxScore, percentage);
        }
        return String.format("Total score: %.2f / %.2f (%.1f%%)", totalScore, maxScore, percentage);
    }

    /**
     * Lấy format số câu đúng
     */
    public String getCorrectCountFormat(String language, long correctCount, int total) {
        if (VIETNAMESE.equals(language)) {
            return String.format("Số câu đúng: %d / %d", correctCount, total);
        }
        return String.format("Correct answers: %d / %d", correctCount, total);
    }

    /**
     * Lấy tiêu đề chi tiết từng câu
     */
    public String getDetailHeader(String language) {
        if (VIETNAMESE.equals(language)) {
            return "Chi tiết từng câu:";
        }
        return "Details per question:";
    }

    /**
     * Validate và normalize language code
     */
    public String normalizeLanguage(String language) {
        if (language == null || language.isBlank()) {
            return DEFAULT_LANGUAGE;
        }
        String normalized = language.trim().toLowerCase();
        if (VIETNAMESE.equals(normalized) || "vie".equals(normalized) || "vn".equals(normalized)) {
            return VIETNAMESE;
        }
        if (ENGLISH.equals(normalized) || "eng".equals(normalized)) {
            return ENGLISH;
        }
        return AUTO;
    }
}
