package com.igcse.ai.dto.aiChamDiem;

import dev.langchain4j.model.output.structured.Description;
import lombok.Data;

/**
 * DTO cho kết quả chấm điểm từ AI (LangChain4j structured output)
 */
@Data
public class EssayGradeResultDTO {

    @Description("The score given to the student's answer, from 0.0 to the max score")
    private double score;

    @Description("Detailed feedback explaining the score and how to improve")
    private String feedback;

    @Description("Confidence level in the grading, from 0.0 to 1.0")
    private double confidenceScore;

    @Description("Reasoning for the confidence score")
    private String confidenceReasoning;
}
