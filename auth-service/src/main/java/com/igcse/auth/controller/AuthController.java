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

    // 1. Health Check (Giữ nguyên để test Gateway)
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Auth Service is connecting to Gateway successfully!");
    }

    // 2. Đăng ký
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        System.out.println(">>> REGISTER REQUEST: " + request.getEmail());
        return ResponseEntity.ok(authService.register(request));
    }

    // 3. Đăng nhập
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // 4. Verify Token (Dùng cho các service khác gọi sang check)
    @PostMapping("/verify-token")
    public ResponseEntity<Boolean> verifyToken(@RequestParam String token) {
        return ResponseEntity.ok(authService.verifyToken(token));
    }

    // 5. Đổi mật khẩu (ĐÃ CẬP NHẬT LOGIC BẢO MẬT)
    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(
            @RequestBody ChangePasswordRequest request,
            Principal connectedUser // <--- QUAN TRỌNG: Lấy user từ Token
    ) {
        authService.changePassword(request, connectedUser);
        return ResponseEntity.ok("Doi mat khau thanh cong!");
    }
}