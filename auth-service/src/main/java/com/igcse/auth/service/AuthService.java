package com.igcse.auth.service;

import com.igcse.auth.config.RabbitMQConfig;
import com.igcse.auth.dto.AuthResponse;
import com.igcse.auth.dto.ChangePasswordRequest;
import com.igcse.auth.dto.LoginRequest;
import com.igcse.auth.dto.RefreshTokenRequest;
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
        switch (requestedRole) {
            case "TEACHER": user.setRole("TEACHER"); break;
            case "PARENT": user.setRole("PARENT"); break;
            default: user.setRole("STUDENT"); break;
        }
        
        user.setActive(true);
        User savedUser = userRepository.save(user);

        // RabbitMQ
        try {
            UserSyncDTO syncData = new UserSyncDTO(
                savedUser.getId(), savedUser.getEmail(), savedUser.getFullName(), savedUser.getRole()
            );
            rabbitTemplate.convertAndSend(RabbitMQConfig.USER_EXCHANGE, RabbitMQConfig.USER_SYNC_ROUTING_KEY, syncData);
        } catch (Exception e) {
            System.err.println(">>> [RabbitMQ] Loi gui tin nhan: " + e.getMessage());
        }

        return "Dang ky thanh cong!";
    }

    // 2. Đăng nhập (ĐÃ SỬA CHO KHỚP VỚI JWTUTILS MỚI)
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User khong ton tai"));

        // Sinh Access Token (1 ngày)
        String token = jwtUtils.generateToken(user.getEmail(), user.getRole(), user.getId());
        
        // Sinh Refresh Token (7 ngày) từ JwtUtils
        String refreshToken = jwtUtils.generateRefreshToken(user.getEmail(), user.getRole(), user.getId());
        
        // [QUAN TRỌNG] Ở đây refreshToken là String rồi, nên truyền thẳng vào, KHÔNG dùng .getToken() nữa
        return new AuthResponse(token, refreshToken, user.getEmail(), user.getRole());
    }

    // 3. Xác thực token
    public boolean verifyToken(String token) {
        return jwtUtils.validateToken(token);
    }

    // 4. Đổi mật khẩu
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
    // 5. Làm mới Token (Refresh Token - Stateless)
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        // 1. Kiểm tra Token có hợp lệ không (còn hạn không, chữ ký đúng không)
        if (!jwtUtils.validateToken(requestRefreshToken)) {
            throw new RuntimeException("Refresh Token khong hop le hoac da het han!");
        }

        // 2. Lấy email từ trong token ra
        String email = jwtUtils.extractEmail(requestRefreshToken);

        // 3. Check lại xem User này còn tồn tại trong DB không (nhỡ bị xóa rồi)
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User khong ton tai!"));

        // 4. Tạo Access Token MỚI (1 ngày)
        String newAccessToken = jwtUtils.generateToken(user.getEmail(), user.getRole(), user.getId());

        // 5. Trả về:
        // - Access Token: MỚI TINH
        // - Refresh Token: GIỮ NGUYÊN CÁI CŨ (để dùng tiếp cho đến khi hết 7 ngày)
        return new AuthResponse(newAccessToken, requestRefreshToken, user.getEmail(), user.getRole());
    }
}