package com.igcse.ai.exception;

/**
 * Exception khi response từ Exam Service không đúng format hoặc thiếu dữ liệu
 */
public class InvalidResponseException extends AIServiceException {
    
    public InvalidResponseException(String message) {
        super(
            message,
            "INVALID_RESPONSE_ERROR",
            "Response from Exam Service is invalid or missing required data"
        );
    }
    
    public InvalidResponseException(String url, String expectedField) {
        this(
            String.format("Invalid response from Exam Service at: %s. Missing or invalid field: %s", 
                url, expectedField)
        );
    }
    
    public InvalidResponseException(String url, Throwable cause) {
        super(
            String.format("Failed to parse response from Exam Service at: %s", url),
            "INVALID_RESPONSE_ERROR",
            "Response parsing failed: " + (cause != null ? cause.getMessage() : "Unknown error")
        );
    }
}


