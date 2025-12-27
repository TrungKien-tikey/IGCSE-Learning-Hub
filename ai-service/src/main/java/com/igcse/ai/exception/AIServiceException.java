package com.igcse.ai.exception;

public class AIServiceException extends RuntimeException {
    private String errorCode;
    private String details;

    public AIServiceException(String message) {
        super(message);
        this.errorCode = "AI_SERVICE_ERROR";
    }

    public AIServiceException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public AIServiceException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "AI_SERVICE_ERROR";
    }

    public AIServiceException(String message, String errorCode, String details) {
        super(message);
        this.errorCode = errorCode;
        this.details = details;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getDetails() {
        return details;
    }
}

