package com.igcse.auth.controller;

import com.igcse.auth.dto.AuthResponse;
import com.igcse.auth.dto.LoginRequest;
import com.igcse.auth.dto.RegisterRequest;
import com.igcse.auth.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth") // <--- SỬA 1: Thêm v1 vào đây cho khớp Kong Gateway
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // <--- SỬA 2: Thêm hàm này để test kết nối (GET Method)
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Auth Service is connecting to Gateway successfully!");
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/verify-token")
    public ResponseEntity<Boolean> verifyToken(@RequestParam String token) {
        return ResponseEntity.ok(authService.verifyToken(token));
    }
}