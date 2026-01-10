package com.igcse.auth.service;

import com.igcse.auth.config.RabbitMQConfig; // Import Config
import com.igcse.auth.dto.AuthResponse;
import com.igcse.auth.dto.LoginRequest;
import com.igcse.auth.dto.RegisterRequest;
import com.igcse.auth.dto.UserSyncDTO; // Import DTO
import com.igcse.auth.entity.User;
import com.igcse.auth.repository.UserRepository;
import com.igcse.auth.util.JwtUtils;
import org.springframework.amqp.rabbit.core.RabbitTemplate; // Import RabbitTemplate
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
    private final RabbitTemplate rabbitTemplate; // 1. Khai báo thêm RabbitTemplate

    // 2. Cập nhật Constructor để tiêm RabbitTemplate vào
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

    // 3. Hàm Đăng ký (Đã tích hợp RabbitMQ)
    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email nay da ton tai!");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        
        if (request.getRole() != null && !request.getRole().isEmpty()) {
            user.setRole(request.getRole().toUpperCase());
        } else {
            user.setRole("STUDENT");
        }
        
        user.setActive(true);

        // Lưu User vào DB (Lúc này mới có ID)
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
                RabbitMQConfig.USER_EXCHANGE,      // Exchange lấy từ Config
                RabbitMQConfig.USER_SYNC_ROUTING_KEY, // Routing Key lấy từ Config
                syncData
            );
            
            System.out.println(">>> [RabbitMQ] Da gui event user moi: " + savedUser.getEmail());

        } catch (Exception e) {
            // Log lỗi nếu RabbitMQ bị sập (để không ảnh hưởng đến việc User đăng ký)
            System.err.println(">>> [RabbitMQ] Loi gui tin nhan: " + e.getMessage());
        }
        // --- KẾT THÚC RabbitMQ ---

        return "Dang ky thanh cong!";
    }

    // 4. Đăng nhập (Giữ nguyên)
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User khong ton tai"));

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole(), user.getId());

        return new AuthResponse(token, user.getEmail(), user.getRole());
    }

    // 5. Xác thực token (Giữ nguyên)
    public boolean verifyToken(String token) {
        return jwtUtils.validateToken(token);
    }

    // 6. Đổi mật khẩu (Giữ nguyên)
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