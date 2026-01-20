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
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final RabbitTemplate rabbitTemplate;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtils jwtUtils,
                       AuthenticationManager authenticationManager,
                       RabbitTemplate rabbitTemplate,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
        this.rabbitTemplate = rabbitTemplate;
        this.emailService = emailService;
    }

    // 1. Đăng ký
    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email nay da ton tai!");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        String requestedRole = (request.getRole() != null) ? request.getRole().toUpperCase() : "STUDENT";
        if ("PARENT".equals(requestedRole)) {
            user.setRole("PARENT");
        } else {
            user.setRole("STUDENT");
        }

        user.setActive(true);
        User savedUser = userRepository.save(user);

        // RabbitMQ Sync
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

    // 4. Đổi mật khẩu (ĐÃ SỬA: Dùng Principal chuẩn)
    public void changePassword(ChangePasswordRequest request, Principal connectedUser) {
        // Lấy email trực tiếp từ Principal (An toàn, không cần ép kiểu)
        String userEmail = connectedUser.getName();
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User khong ton tai"));

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalStateException("Mat khau xac nhan khong khop!");
        }
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new IllegalStateException("Mat khau cu khong chinh xac!");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        System.out.println(">>> User " + user.getEmail() + " da doi mat khau thanh cong.");
    }

    // 5. Quên mật khẩu
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Khong tim thay user voi email: " + email));

        String token = UUID.randomUUID().toString();

        user.setResetPasswordToken(token);
        user.setTokenExpirationTime(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        String resetLink = "http://localhost:5173/reset-password?token=" + token;

        String emailBody = "Xin chao " + user.getFullName() + ",\n\n"
                + "Ban da yeu cau dat lai mat khau.\n"
                + "Day la ma Token cua ban: " + token + "\n\n"
                + "Hoac bam vao link sau de dat lai mat khau ngay:\n" + resetLink + "\n\n"
                + "Link nay se het han sau 15 phut.";

        emailService.sendEmail(user.getEmail(), "Yeu cau dat lai mat khau - IGCSE Hub", emailBody);
    }

    // 6. Đặt lại mật khẩu
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new RuntimeException("Ma Token khong hop le hoac khong ton tai"));

        if (user.getTokenExpirationTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Ma Token da het han! Vui long yeu cau lai.");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setTokenExpirationTime(null);

        userRepository.save(user);
    }


    // 7. Kiểm tra email tồn tại
    public boolean checkEmailExists(String email) {
        return userRepository.existsByEmail(email); 
    }


    public UserSyncDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay User ID: " + id));
        
        // Trả về DTO chứa thông tin public (Tên, Email, Role)
        return new UserSyncDTO(
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getRole()
        );
    }
}
    

