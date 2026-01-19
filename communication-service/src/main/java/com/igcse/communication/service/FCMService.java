package com.igcse.communication.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import org.springframework.stereotype.Service;

@Service
public class FCMService {

    // Gửi cho 1 topic chung (Ví dụ: tất cả học sinh)
    public void sendToTopic(String topic, String title, String body, Long examId) {
        Notification notification = Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build();

        Message message = Message.builder()
                .setTopic(topic) // Quan trọng: Gửi theo Topic
                .setNotification(notification)
                .putData("type", "EXAM_NEW")
                .putData("examId", String.valueOf(examId))
                .build();

        try {
            String response = FirebaseMessaging.getInstance().send(message);
            System.out.println(">>> FCM Sent successfully to topic [" + topic + "]: " + response);
        } catch (Exception e) {
            System.err.println(">>> FCM Error: " + e.getMessage());
        }
    }
}