package com.igcse.ai.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception cho các lỗi HTTP 5xx từ Exam Service
 * (Internal Server Error, Service Unavailable, Gateway Timeout, etc.)
 */
public class ExamServiceServerException extends AIServiceException {
    
    private final HttpStatus httpStatus;
    
    public ExamServiceServerException(String message, HttpStatus httpStatus) {
        super(
            message,
            "EXAM_SERVICE_SERVER_ERROR",
            String.format("HTTP %d: %s - Exam Service is experiencing issues", 
                httpStatus.value(), httpStatus.getReasonPhrase())
        );
        this.httpStatus = httpStatus;
    }
    
    public ExamServiceServerException(String url, HttpStatus httpStatus, String responseBody) {
        this(
            String.format("Server error when calling Exam Service at: %s", url),
            httpStatus
        );
    }
    
    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}






