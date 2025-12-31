package com.igcse.ai.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception cho các lỗi HTTP 4xx từ Exam Service
 * (Bad Request, Not Found, Unauthorized, etc.)
 */
public class ExamServiceClientException extends AIServiceException {
    
    private final HttpStatus httpStatus;
    
    public ExamServiceClientException(String message, HttpStatus httpStatus) {
        super(
            message,
            "EXAM_SERVICE_CLIENT_ERROR",
            String.format("HTTP %d: %s", httpStatus.value(), httpStatus.getReasonPhrase())
        );
        this.httpStatus = httpStatus;
    }
    
    public ExamServiceClientException(String url, HttpStatus httpStatus, String responseBody) {
        this(
            String.format("Client error when calling Exam Service at: %s", url),
            httpStatus
        );
    }
    
    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}


