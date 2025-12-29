package com.igcse.ai.service.llm;

import dev.langchain4j.model.output.structured.Description;

public class EssayGradeResult {

    @Description("The score given to the student's answer, from 0.0 to the max score")
    private double score;

    @Description("Detailed feedback explaining the score and how to improve")
    private String feedback;

    @Description("Confidence level in the grading, from 0.0 to 1.0")
    private double confidenceScore;

    @Description("Reasoning for the confidence score")
    private String confidenceReasoning;

    public double getScore() {
        return score;
    }

    public void setScore(double score) {
        this.score = score;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public String getConfidenceReasoning() {
        return confidenceReasoning;
    }

    public void setConfidenceReasoning(String confidenceReasoning) {
        this.confidenceReasoning = confidenceReasoning;
    }
}
