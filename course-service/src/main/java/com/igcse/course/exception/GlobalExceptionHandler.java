package com.igcse.course.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Sai định dạng tham số
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.status(400).body(Map.of(
                "status", 400,
                "message", "Tham số '" + ex.getName() + "' không hợp lệ. Phải là kiểu số (Long)!"));
    }

    // Lỗi validation từ @Valid
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getFieldError().getDefaultMessage();

        return ResponseEntity.status(400).body(Map.of(
                "status", 400,
                "error", "Dữ liệu đầu vào không hợp lệ",
                "message", errorMessage));
    }

    // Vi phạm ràng buộc @Min/@Max
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
        String errorMessage = ex.getConstraintViolations().iterator().next().getMessage();

        return ResponseEntity.status(400).body(Map.of(
                "status", 400,
                "error", "Vi phạm ràng buộc dữ liệu",
                "message", errorMessage));
    }
}