package com.igcse.auth.service;

import com.igcse.auth.config.RabbitMQConfig;
import com.igcse.auth.dto.AuthResponse;
import com.igcse.auth.dto.ChangePasswordRequest;
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

import java.security.Principal;

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
        String requestedRole = (request.getRole() != null) ? request.getRole().toUpperCase() : "STUDENT";

        if ("PARENT".equals(requestedRole)) {
            user.setRole("PARENT");
        } else {
            user.setRole("STUDENT"); // Mặc định tất cả trường hợp khác là STUDENT
        }
        
        user.setActive(true);

        // Lưu vào DB
        User savedUser = userRepository.save(user);

        // --- BẮT ĐẦU: Gửi tin nhắn sang RabbitMQ (Sync User) ---
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
            
            System.out.println(">>> [RabbitMQ] Da gui event user moi: " + savedUser.getEmail());

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

        // Generate Token có chứa userId và role
        String token = jwtUtils.generateToken(user.getEmail(), user.getRole(), user.getId());

        return new AuthResponse(token, user.getEmail(), user.getRole());
    }

    // 3. Xác thực token
    public boolean verifyToken(String token) {
        return jwtUtils.validateToken(token);
    }

    // 4. Đổi mật khẩu (Phiên bản Bảo mật & Chuẩn logic)
    public void changePassword(ChangePasswordRequest request, Principal connectedUser) {
        // A. Lấy user hiện tại từ Token (Tránh việc hacker đổi pass của người khác)
        var authUser = (org.springframework.security.core.userdetails.User) ((UsernamePasswordAuthenticationToken) connectedUser).getPrincipal();
        
        // B. Tìm user trong DB
        User user = userRepository.findByEmail(authUser.getUsername())
                .orElseThrow(() -> new RuntimeException("User khong ton tai"));

        // C. Kiểm tra logic confirm password
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalStateException("Mat khau xac nhan khong khop!");
        }

        // D. Kiểm tra mật khẩu cũ
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new IllegalStateException("Mat khau cu khong chinh xac!");
        }

        // E. Cập nhật mật khẩu mới (Mã hóa trước khi lưu)
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        System.out.println(">>> User " + user.getEmail() + " da doi mat khau thanh cong.");
    }
}