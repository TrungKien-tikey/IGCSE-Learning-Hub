package com.igcse.auth.controller;

import com.igcse.auth.dto.AuthResponse;
import com.igcse.auth.dto.LoginRequest;
import com.igcse.auth.dto.RefreshTokenRequest;
import com.igcse.auth.dto.RegisterRequest;
import com.igcse.auth.dto.ChangePasswordRequest; // Import class này
import com.igcse.auth.service.AuthService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map; // Import Map để lấy email từ request body

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // 1. API Health Check (Để test kết nối)
    @GetMapping("/health")
    public Map<String, String> healthCheck() {
        return Map.of("status", "UP", "message", "Auth Service is connecting to Gateway successfully!");
    }

    // 2. API Đăng ký
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        System.out.println("GỌI VÀO REGISTER: " + request.getEmail());
        return ResponseEntity.ok(authService.register(request));
    }

    // 3. API Đăng nhập
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // 👇 4. API CHECK TRÙNG EMAIL (MỚI THÊM)
    // Frontend gửi lên: { "email": "abc@gmail.com" }
    // Backend trả về: true (đã có) hoặc false (chưa có)
    @PostMapping("/check-email")
    public ResponseEntity<Boolean> checkEmailExist(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        boolean exists = authService.checkEmailExist(email);
        return ResponseEntity.ok(exists);
    }

    // 5. API Verify Token (Dùng cho Gateway hoặc các Service khác gọi sang)
    @PostMapping("/verify-token")
    public ResponseEntity<Boolean> verifyToken(@RequestParam String token) {
        return ResponseEntity.ok(authService.verifyToken(token));
    }

    // 6. API Quên mật khẩu (Public - Không cần auth)
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestParam String email) {
        try {
            authService.forgotPassword(email);
            return ResponseEntity.ok("Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 7. API Đặt lại mật khẩu (Public - Không cần auth)
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestParam String token, @RequestParam String newPassword) {
        try {
            authService.resetPassword(token, newPassword);
            return ResponseEntity.ok("Mật khẩu đã được đặt lại thành công!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 8. API Đổi mật khẩu (Cần auth)
    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@RequestBody ChangePasswordRequest request) {
        return ResponseEntity.ok(authService.changePassword(request));
    }

    // 9. API Refresh Token
    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenRequest request) {
        try {
            AuthResponse response = authService.refreshToken(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }
}