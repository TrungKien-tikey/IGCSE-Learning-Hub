package com.igcse.communication.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.igcse.communication.dto.ExamEvent;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
@Service
public class NotificationListener {

    // --- PHẦN QUAN TRỌNG ĐÃ SỬA ---
    // Dùng @QueueBinding để tự động tạo Queue và Exchange nếu chưa có
    @RabbitListener(bindings = @QueueBinding(
        value = @Queue(value = "exam.created.queue", durable = "true"),
        exchange = @Exchange(value = "exam.exchange", type = "topic"),
        key = "exam.created"
    ))
    // -----------------------------
    public void handleExamCreated(ExamEvent event) {
        System.out.println("LOG: Đã nhận được sự kiện tạo bài thi: " + event.getExamTitle());
        sendFCM(event);
    }

    private void sendFCM(ExamEvent event) {
        // Topic quy ước là: course_{id}
        // Kiểm tra null để tránh lỗi
        if (event.getCourseId() == null) return;
        
        String topic = "course_" + event.getCourseId();

        Notification notification = Notification.builder()
                .setTitle("Bài tập mới!")
                .setBody("Môn học của bạn vừa có bài thi mới: " + event.getExamTitle())
                .build();

        Message message = Message.builder()
                .setTopic(topic)
                .setNotification(notification)
                .putData("examId", String.valueOf(event.getExamId()))
                .build();

        try {
            String response = FirebaseMessaging.getInstance().send(message);
            System.out.println("LOG: Đã gửi FCM thành công: " + response);
        } catch (Exception e) {
            System.err.println("LOG: Gửi FCM thất bại (Có thể do chưa config đúng key): " + e.getMessage());
        }
    }
}