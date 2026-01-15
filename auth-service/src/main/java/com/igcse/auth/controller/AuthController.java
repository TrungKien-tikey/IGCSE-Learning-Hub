package com.igcse.auth.controller;

import com.igcse.auth.dto.AuthResponse;
import com.igcse.auth.dto.ChangePasswordRequest;
import com.igcse.auth.dto.LoginRequest;
import com.igcse.auth.dto.RegisterRequest;
import com.igcse.auth.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // 1. Health Check
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Auth Service is connecting to Gateway successfully!");
    }

    // 2. Đăng ký
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    // 3. Đăng nhập
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // 4. Verify Token
    @PostMapping("/verify-token")
    public ResponseEntity<Boolean> verifyToken(@RequestParam String token) {
        return ResponseEntity.ok(authService.verifyToken(token));
    }

    // 5. Đổi mật khẩu
    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(
            @RequestBody ChangePasswordRequest request,
            Principal connectedUser
    ) {
        authService.changePassword(request, connectedUser);
        return ResponseEntity.ok("Doi mat khau thanh cong!");
    }

    // 6. [MỚI] Quên mật khẩu (Gửi email)
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestParam String email) {
        try {
            authService.forgotPassword(email);
            return ResponseEntity.ok("Link dat lai mat khau da duoc gui vao email cua ban.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Loi: " + e.getMessage());
        }
    }

    // 7. [MỚI] Đặt lại mật khẩu (Reset)
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @RequestParam String token, 
            @RequestParam String newPassword
    ) {
        try {
            authService.resetPassword(token, newPassword);
            return ResponseEntity.ok("Mat khau da duoc dat lai thanh cong! Ban co the dang nhap ngay.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Loi: " + e.getMessage());
        }
    }
}