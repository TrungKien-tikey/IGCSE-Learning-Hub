package com.igcse.ai.exception;

public class ExamAttemptNotFoundException extends AIServiceException {
    public ExamAttemptNotFoundException(Long attemptId) {
        super(
            String.format("Exam attempt not found: %d", attemptId),
            "EXAM_ATTEMPT_NOT_FOUND",
            "Attempt ID: " + attemptId
        );
    }
}

