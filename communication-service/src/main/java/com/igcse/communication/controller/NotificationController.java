package com.igcse.communication.controller;

import lombok.extern.slf4j.Slf4j;

import com.igcse.communication.entity.Notification;
import com.igcse.communication.repository.NotificationRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Key;
import java.util.List;
import org.springframework.web.client.RestTemplate;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.TopicManagementResponse;
import java.util.Map;
import java.util.Collections;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowCredentials = "false")
@Slf4j
public class NotificationController {

    private final FirebaseMessaging firebaseMessaging;
    private final NotificationRepository notificationRepository;

    @GetMapping("/health")
    public java.util.Map<String, String> health() {
        return java.util.Map.of("status", "UP");
    }

    @PostMapping("/subscribe")
    public String subscribeToTopic(@RequestBody Map<String, String> body) {
        String token = body.get("token") != null ? body.get("token").trim() : null;

        if (token == null || token.isEmpty()) {
            log.warn("Token gửi lên bị RỖNG!");
            return "Token is missing";
        }

        log.info(">>> Đang đăng ký Token: {}...", token.substring(0, Math.min(token.length(), 10)));

        try {
            TopicManagementResponse response = firebaseMessaging.subscribeToTopic(
                    Collections.singletonList(token),
                    "students");

            if (response.getFailureCount() > 0) {
                log.error("Đăng ký thất bại!");
                response.getErrors().forEach(error -> {
                    log.error("   Lý do: {}", error.getReason());
                });
            } else {
                log.info("Đăng ký thành công! (Success: {})", response.getSuccessCount());
            }

            return "Kết quả: " + response.getSuccessCount() + " thành công, " + response.getFailureCount()
                    + " thất bại.";
        } catch (Exception e) {
            log.error("Lỗi Exception khi subscribe:", e);
            return "Lỗi Exception: " + e.getMessage();
        }
    }

    // TODO: Move this to application.properties
    private static final String SECRET_KEY = "daylakeybimatcuatoiphaidudaivaphucktap123456789";

    @GetMapping
    public ResponseEntity<?> getMyNotifications(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Lỗi: Không thấy Token gửi lên!");
            return ResponseEntity.status(401).body("Thiếu Token!");
        }
        String token = authHeader.substring(7);

        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            Object userIdObj = claims.get("userId");

            if (userIdObj == null) {
                log.warn("Lỗi: Token không chứa userId");
                return ResponseEntity.status(403).body("Token cũ không có ID");
            }

            Long userId;
            if (userIdObj instanceof Integer) {
                userId = ((Integer) userIdObj).longValue();
            } else {
                userId = ((Number) userIdObj).longValue();
            }

            List<Notification> list = notificationRepository.findMyNotifications(userId);
            return ResponseEntity.ok(list);

        } catch (io.jsonwebtoken.security.SignatureException e) {
            log.error("Lỗi sai Key bảo mật", e);
            return ResponseEntity.status(403).body("Sai Key bảo mật");
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.warn("Token đã hết hạn");
            return ResponseEntity.status(403).body("Token hết hạn");
        } catch (Exception e) {
            log.error("Lỗi xác thực Token", e);
            return ResponseEntity.status(403).body("Lỗi Token: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        return notificationRepository.findById(id)
                .map(notification -> {
                    notification.setRead(true);
                    notificationRepository.save(notification);
                    return ResponseEntity.ok("Đã đánh dấu đã đọc");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }
}
