package com.igcse.auth.service;

import com.igcse.auth.config.RabbitMQConfig;
import com.igcse.auth.dto.*;
import com.igcse.auth.entity.BlacklistedToken;
import com.igcse.auth.entity.User;
import com.igcse.auth.repository.BlacklistedTokenRepository;
import com.igcse.auth.repository.UserRepository;
import com.igcse.auth.util.JwtUtils;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
    private final BlacklistedTokenRepository blacklistedTokenRepository;

    // Constructor Injection (Thay vì @Autowired)
    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtils jwtUtils,
                       AuthenticationManager authenticationManager,
                       RabbitTemplate rabbitTemplate,
                       EmailService emailService,
                       BlacklistedTokenRepository blacklistedTokenRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
        this.rabbitTemplate = rabbitTemplate;
        this.emailService = emailService;
        this.blacklistedTokenRepository = blacklistedTokenRepository;
    }

    // 1. ĐĂNG KÝ (Có bắn RabbitMQ)
    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email nay da ton tai!");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        // Xử lý Role
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

        user.setActive(true);
        User savedUser = userRepository.save(user);

        // Gửi thông tin sang User Service qua RabbitMQ
        try {
            UserSyncDTO syncData = new UserSyncDTO(
                    savedUser.getId(),
                    savedUser.getEmail(),
                    savedUser.getFullName(),
                    savedUser.getRole());
            
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.USER_EXCHANGE,
                    RabbitMQConfig.USER_SYNC_ROUTING_KEY,
                    syncData);
            System.out.println(">>> [RabbitMQ] Da gui event user moi: " + savedUser.getEmail());
        } catch (Exception e) {
            System.err.println(">>> [RabbitMQ] Loi gui tin nhan: " + e.getMessage());
        }

        return "Dang ky thanh cong!";
    }

    // 2. ĐĂNG NHẬP
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User khong ton tai"));

        // Sinh Access Token (1 ngày)
        String token = jwtUtils.generateToken(user.getEmail(), user.getRole(), user.getId(),
                user.getVerificationStatus());

        // Sinh Refresh Token (7 ngày)
        String refreshToken = jwtUtils.generateRefreshToken(user.getEmail(), user.getRole(), user.getId());

        return new AuthResponse(token, refreshToken, user.getEmail(), user.getRole());
    }

    // 3. CHECK EMAIL TỒN TẠI (Dùng cho nút Đăng ký Frontend)
    public boolean checkEmailExist(String email) {
        return userRepository.existsByEmail(email);
    }

    // 4. VERIFY TOKEN
    public boolean verifyToken(String token) {
        return jwtUtils.validateToken(token);
    }

    // 5. ĐỔI MẬT KHẨU
    public String changePassword(ChangePasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User khong ton tai"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Mat khau cu khong chinh xac!");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return "Doi mat khau thanh cong!";
    }

    // 6. REFRESH TOKEN
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        if (!jwtUtils.validateToken(requestRefreshToken)) {
            throw new RuntimeException("Refresh Token khong hop le hoac da het han!");
        }

        String email = jwtUtils.extractEmail(requestRefreshToken);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User khong ton tai!"));

        String newAccessToken = jwtUtils.generateToken(user.getEmail(), user.getRole(), user.getId(),
                user.getVerificationStatus());

        return new AuthResponse(newAccessToken, requestRefreshToken, user.getEmail(), user.getRole());
    }

    // 7. QUÊN MẬT KHẨU
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email khong ton tai trong he thong!"));

        String token = UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        user.setTokenExpirationTime(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        // Lưu ý: Đổi port 5173 thành port Frontend của bạn nếu cần
        String resetLink = "https://igcse-learning-hub.vercel.app/reset-password?token=" + token;

        String emailBody = "Xin chao " + user.getFullName() + ",\n\n"
                + "Ban da yeu cau dat lai mat khau.\n"
                + "Day la ma Token cua ban: " + token + "\n\n"
                + "Hoac bam vao link sau de dat lai mat khau ngay:\n" + resetLink + "\n\n"
                + "Link nay se het han sau 15 phut.";

        emailService.sendEmail(user.getEmail(), "Yeu cau dat lai mat khau - IGCSE Hub", emailBody);
    }

    // 8. ĐẶT LẠI MẬT KHẨU (RESET)
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

    // 9. ĐĂNG XUẤT
    public void logout(String token) {
        if (jwtUtils.isTokenExpired(token)) {
            return;
        }

        // --- SỬA ĐOẠN NÀY (Dùng new thay vì builder) ---
        BlacklistedToken blacklistedToken = new BlacklistedToken();
        blacklistedToken.setToken(token);
        blacklistedToken.setExpirationTime(jwtUtils.extractExpiration(token));
        // ------------------------------------------------

        blacklistedTokenRepository.save(blacklistedToken);
    }
}