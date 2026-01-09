package com.igcse.ai.exception;

/**
 * Exception khi không thể kết nối đến Exam Service
 * (Connection timeout, network error, service unavailable)
 */
public class ExamServiceConnectionException extends AIServiceException {
    
    public ExamServiceConnectionException(String message, Throwable cause) {
        super(
            message,
            "EXAM_SERVICE_CONNECTION_ERROR",
            "Failed to connect to Exam Service: " + (cause != null ? cause.getMessage() : "Unknown error")
        );
    }
    
    public ExamServiceConnectionException(String url) {
        super(
            String.format("Connection error when calling Exam Service at: %s", url),
            "EXAM_SERVICE_CONNECTION_ERROR",
            "Failed to connect to Exam Service"
        );
    }
    
    public static ExamServiceConnectionException withUrl(String url, Throwable cause) {
        return new ExamServiceConnectionException(
            String.format("Connection error when calling Exam Service at: %s", url),
            cause
        );
    }
}

