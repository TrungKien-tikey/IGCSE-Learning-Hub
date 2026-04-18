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

    // 1. Xử lý lỗi sai định dạng tham số (Ví dụ: ID phải là số nhưng nhập chữ)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.status(400).body(Map.of(
                "status", 400,
                "message", "Tham số '" + ex.getName() + "' không hợp lệ. Phải là kiểu số (Long)!"));
    }

    // 2. Xử lý lỗi Validation khi sử dụng @Valid ở tầng Controller
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        // Lấy thông báo lỗi cụ thể từ các annotation như @NotBlank, @NotNull
        String errorMessage = ex.getBindingResult().getFieldError().getDefaultMessage();

        return ResponseEntity.status(400).body(Map.of(
                "status", 400,
                "error", "Dữ liệu đầu vào không hợp lệ",
                "message", errorMessage));
    }

    // 3. QUAN TRỌNG: Xử lý lỗi vi phạm ràng buộc từ Entity (Sửa lỗi 500 cho Min -1/Max +1)
    // Lỗi này xảy ra khi dữ liệu vượt biên @Min, @Max trong file Course.java
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
        // Lấy thông báo lỗi đầu tiên trong danh sách vi phạm
        String errorMessage = ex.getConstraintViolations().iterator().next().getMessage();

        return ResponseEntity.status(400).body(Map.of(
                "status", 400,
                "error", "Vi phạm ràng buộc dữ liệu",
                "message", errorMessage));
    }
}