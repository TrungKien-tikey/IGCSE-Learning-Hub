package com.igcse.communication.service;

import com.igcse.communication.dto.ExamCreatedEvent;
import com.igcse.communication.entity.Notification;
import com.igcse.communication.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationListener {

    private final NotificationRepository notificationRepository;
    private final FCMService fcmService;

    @RabbitListener(bindings = @QueueBinding(
        value = @Queue(value = "notification.exam.created.queue", durable = "true"),
        exchange = @Exchange(value = "exam.notification.exchange", type = "topic"),
        key = "exam.created"
    ))
    public void handleExamCreated(ExamCreatedEvent event) {
        System.out.println(">>> [RabbitMQ] Nhận sự kiện tạo Exam: " + event.getExamTitle());

        try {
            // 1. Lưu thông báo vào DB
            // Vì đây là thông báo chung (không có courseId), ta có thể lưu 1 bản ghi dạng "SYSTEM"
            // Hoặc nếu muốn hiển thị cho user cụ thể, cần logic lấy danh sách user. 
            // Ở đây mình lưu 1 bản ghi đại diện (userId = 0 hoặc null) để hiển thị ở bảng tin chung.
            Notification notification = new Notification();
            notification.setUserId(0L); // 0L đại diện cho 'All Students'
            notification.setTitle("Bài thi mới: " + event.getExamTitle());
            notification.setMessage(event.getDescription() != null ? event.getDescription() : "Hãy vào làm bài thi ngay!");
            notification.setType("EXAM_ALERT");
            notification.setRead(false);
            notification.setCreatedAt(LocalDateTime.now());
            
            notificationRepository.save(notification);

            // 2. Gửi Push Notification qua Firebase (FCM)
            // Gửi tới Topic "students" - Frontend cần subscribe topic này
            fcmService.sendToTopic("students", notification.getTitle(), notification.getMessage(), event.getExamId());

        } catch (Exception e) {
            System.err.println("Lỗi xử lý notification: " + e.getMessage());
            e.printStackTrace();
        }
    }
}