package com.igcse.communication.controller;
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
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowCredentials = "false") // Cho phép gọi từ mọi nơi để test
public class NotificationController {

    private final FirebaseMessaging firebaseMessaging;
    private final NotificationRepository notificationRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/subscribe")
    public String subscribeToTopic(@RequestBody Map<String, String> body) {
        String token = body.get("token").trim();
        
        // 1. Kiểm tra xem token có nhận được không
        if (token == null || token.isEmpty()) {
            System.err.println(" LỖI: Token gửi lên bị RỖNG!");
            return "Token is missing";
        }
        
        System.out.println(">>> Đang đăng ký Token: " + token.substring(0, 10) + "..."); 

        try {
            TopicManagementResponse response = firebaseMessaging.subscribeToTopic(
                Collections.singletonList(token), 
                "students"
            );
            
            // 2. IN CHI TIẾT LỖI NẾU CÓ
            if (response.getFailureCount() > 0) {
                System.err.println(" Đăng ký thất bại!");
                response.getErrors().forEach(error -> {
                    System.err.println("   Lý do: " + error.getReason()); // Vd: INVALID_ARGUMENT
                });
            } else {
                System.out.println(" Đăng ký thành công! (Success: " + response.getSuccessCount() + ")");
            }
            
            return "Kết quả: " + response.getSuccessCount() + " thành công, " + response.getFailureCount() + " thất bại.";
        } catch (Exception e) {
            e.printStackTrace();
            return "Lỗi Exception: " + e.getMessage();
        }
    }
private static final String SECRET_KEY = "daylakeybimatcuatoiphaidudaivaphucktap123456789";

    // 1. API LẤY DANH SÁCH (Tự giải mã Token lấy ID)
 @GetMapping
    public ResponseEntity<?> getMyNotifications(HttpServletRequest request) {
        System.out.println(">>> 1. Đã nhận Request lấy thông báo!"); // Log 1

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.err.println(">>> LỖI: Không thấy Token gửi lên!");
            return ResponseEntity.status(401).body("Thiếu Token!");
        }
        String token = authHeader.substring(7);

        try {
            // Thử giải mã
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            System.out.println(">>> 2. Giải mã Token thành công!"); // Log 2

            // Lấy ID
            Object userIdObj = claims.get("userId");
            System.out.println(">>> 3. Giá trị userId trong Token là: " + userIdObj); // Log 3

            if (userIdObj == null) {
                System.err.println(">>> LỖI: Token này không chứa userId (Token cũ rồi!)");
                return ResponseEntity.status(403).body("Token cũ không có ID");
            }

            // Ép kiểu an toàn
            Long userId;
            if (userIdObj instanceof Integer) {
                userId = ((Integer) userIdObj).longValue();
            } else {
                userId = ((Number) userIdObj).longValue();
            }

            System.out.println("✅ 4. Lấy ID thành công: " + userId + ". Đang gọi Database..."); 
            
            // Gọi Database
            List<Notification> list = notificationRepository.findMyNotifications(userId);
            System.out.println(">>> 5. Kết quả Database trả về: " + list.size() + " thông báo.");

            return ResponseEntity.ok(list);

        } catch (io.jsonwebtoken.security.SignatureException e) {
            System.err.println(">>> LỖI SAI KEY: Secret Key bên này khác bên Auth Service!");
            return ResponseEntity.status(403).body("Sai Key bảo mật");
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            System.err.println(">>> LỖI: Token đã hết hạn!");
            return ResponseEntity.status(403).body("Token hết hạn");
        } catch (Exception e) {
            System.err.println(">>> LỖI KHÁC: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(403).body("Lỗi Token: " + e.getMessage());
        }
    }

    // 2. API ĐÁNH DẤU ĐÃ ĐỌC (Mark as read)
   // API đánh dấu đã đọc
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        return notificationRepository.findById(id)
                .map(notification -> {
                    notification.setRead(true); // Đổi thành true
                    notificationRepository.save(notification);
                    return ResponseEntity.ok("Đã đánh dấu đã đọc");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }
}
    
 