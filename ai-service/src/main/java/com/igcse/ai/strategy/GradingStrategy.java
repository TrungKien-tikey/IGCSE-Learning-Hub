package com.igcse.ai.strategy;

import com.igcse.ai.dto.AnswerDTO;
import com.igcse.ai.dto.GradingResult;

/**
 * Interface cho chiến lược chấm điểm (Strategy Pattern)
 */
public interface GradingStrategy {
    /**
     * Chấm điểm một câu trả lời
     */
    GradingResult grade(AnswerDTO answer, String language);

    /**
     * Kiểm tra strategy này có hỗ trợ loại câu hỏi không
     */
    boolean supports(String answerType);
}
