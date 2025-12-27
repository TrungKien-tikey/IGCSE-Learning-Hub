package com.igcse.ai.exception;

public class AIResultNotFoundException extends AIServiceException {
    public AIResultNotFoundException(Long attemptId) {
        super(
            String.format("AI result not found for attempt: %d", attemptId),
            "AI_RESULT_NOT_FOUND",
            "Attempt ID: " + attemptId
        );
    }
}

