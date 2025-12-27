package com.igcse.ai.exception;

public class ExamGradingException extends AIServiceException {
    public ExamGradingException(String message, Long attemptId) {
        super(
            message,
            "EXAM_GRADING_FAILED",
            "Attempt ID: " + attemptId
        );
    }

    public ExamGradingException(String message, Throwable cause) {
        super(message, "EXAM_GRADING_FAILED", cause.getMessage());
    }
}

