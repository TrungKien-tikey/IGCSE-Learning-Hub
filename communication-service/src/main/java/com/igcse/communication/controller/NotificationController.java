package com.igcse.communication.controller;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.TopicManagementResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowCredentials = "false") // Cho phép gọi từ mọi nơi để test
public class NotificationController {

    private final FirebaseMessaging firebaseMessaging;

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
}