package com.igcse.course.exception;

import java.util.HashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MethodArgumentNotValidException;
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Fix lỗi TC-COURSE-03: ID sai định dạng (400)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.status(400).body(Map.of(
                "status", 400,
                "message", "Tham số '" + ex.getName() + "' không hợp lệ. Phải là kiểu số (Long)!"));
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(
            org.springframework.web.bind.MethodArgumentNotValidException ex) {

        // Lấy thông báo lỗi cụ thể từ annotation @NotBlank
        String errorMessage = ex.getBindingResult().getFieldError().getDefaultMessage();

        Map<String, Object> body = new HashMap<>();
        body.put("status", 400);
        body.put("error", "Dữ liệu đầu vào không hợp lệ");
        body.put("message", errorMessage); // Trả về "Tiêu đề bài học không được để trống"

        return ResponseEntity.status(400).body(body);
    }

    
}