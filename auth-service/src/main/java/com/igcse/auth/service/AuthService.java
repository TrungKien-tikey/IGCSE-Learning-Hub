package com.igcse.auth.service;

import com.igcse.auth.config.RabbitMQConfig;
import com.igcse.auth.dto.AuthResponse;
import com.igcse.auth.dto.LoginRequest;
import com.igcse.auth.dto.RegisterRequest;
import com.igcse.auth.dto.UserSyncDTO;
import com.igcse.auth.entity.User;
import com.igcse.auth.repository.UserRepository;
import com.igcse.auth.util.JwtUtils;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final RabbitTemplate rabbitTemplate;

    public AuthService(UserRepository userRepository, 
                       PasswordEncoder passwordEncoder, 
                       JwtUtils jwtUtils, 
                       AuthenticationManager authenticationManager,
                       RabbitTemplate rabbitTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
        this.rabbitTemplate = rabbitTemplate;
    }

    // 1. Đăng ký (Đã tích hợp Security & RabbitMQ)
    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email nay da ton tai!");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        
        // --- LOGIC BẢO MẬT ROLE MỚI ---
        // Chỉ cho phép đăng ký là PARENT hoặc STUDENT.
        // Nếu cố tình nhập ADMIN, TEACHER... sẽ bị ép về STUDENT.
        String requestedRole = (request.getRole() != null) ? request.getRole().toUpperCase() : "STUDENT";
        switch (requestedRole) {
            case "TEACHER":
                user.setRole("TEACHER");
                break;
            case "PARENT":
                user.setRole("PARENT");
                break;
            default:
                user.setRole("STUDENT");
                break;
        }
        // -------------------------------
        
        user.setActive(true);

        // Lưu vào DB
        User savedUser = userRepository.save(user);

        // --- BẮT ĐẦU: Gửi tin nhắn sang RabbitMQ ---
        try {
            UserSyncDTO syncData = new UserSyncDTO(
                savedUser.getId(), 
                savedUser.getEmail(), 
                savedUser.getFullName(), 
                savedUser.getRole()
            );

            rabbitTemplate.convertAndSend(
                RabbitMQConfig.USER_EXCHANGE,
                RabbitMQConfig.USER_SYNC_ROUTING_KEY,
                syncData
            );
            
            System.out.println(">>> [RabbitMQ] Da gui event user moi: " + savedUser.getEmail() + " | Role: " + savedUser.getRole());

        } catch (Exception e) {
            System.err.println(">>> [RabbitMQ] Loi gui tin nhan: " + e.getMessage());
        }
        // --- KẾT THÚC RabbitMQ ---

        return "Dang ky thanh cong!";
    }

    // 2. Đăng nhập
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User khong ton tai"));

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole(), user.getId());

        return new AuthResponse(token, user.getEmail(), user.getRole());
    }

    // 3. Xác thực token
    public boolean verifyToken(String token) {
        return jwtUtils.validateToken(token);
    }

    // 4. Đổi mật khẩu
    public String changePassword(com.igcse.auth.dto.ChangePasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User khong ton tai"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Mat khau cu khong chinh xac!");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return "Doi mat khau thanh cong!";
    }
}