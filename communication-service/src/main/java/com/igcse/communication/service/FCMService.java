package com.igcse.communication.service;

import com.google.firebase.messaging.*;
import org.springframework.stereotype.Service;

@Service
public class FCMService {
    public void sendNotification(Long userId, String title, String body) {
        // Trong thực tế, bạn cần map userId -> fcmToken (Lưu trong bảng Users hoặc TokenStore)
        // Ở đây mình giả sử gửi tới một topic chung cho demo
        String topic = "user_" + userId; 
        
        Message message = Message.builder()
                .putData("title", title)
                .putData("body", body)
                .setTopic(topic) // Hoặc .setToken(deviceToken)
                .setNotification(com.google.firebase.messaging.Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build())
                .build();
        try {
            FirebaseMessaging.getInstance().send(message);
        } catch (FirebaseMessagingException e) {
            e.printStackTrace();
        }
    }
}