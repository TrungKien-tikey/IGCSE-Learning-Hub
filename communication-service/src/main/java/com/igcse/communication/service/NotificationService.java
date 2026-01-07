package com.igcse.communication.service;

import com.igcse.communication.dto.ExamCreatedEvent;
import com.igcse.communication.entity.Notification;
import com.igcse.communication.repository.NotificationRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

@Service
public class NotificationService {
    @Autowired private NotificationRepository repository;
    @Autowired private FCMService fcmService;
    @Autowired private ObjectMapper objectMapper;

    // 1. Lắng nghe sự kiện từ RabbitMQ
    @RabbitListener(queues = "exam.created.queue")
    public void handleExamCreatedEvent(String messageJson) {
        try {
            ExamCreatedEvent event = objectMapper.readValue(messageJson, ExamCreatedEvent.class);
            
            // Logic: Tạo thông báo cho toàn bộ học sinh trong khóa học (Giả lập gửi cho user 1)
            Long dummyStudentId = 1L; 

            // a. Lưu vào DB
            Notification noti = new Notification();
            noti.setUserId(dummyStudentId);
            noti.setTitle("Đề thi mới: " + event.getExamTitle());
            noti.setMessage("Một đề thi mới đã được tạo trong khóa học " + event.getCourseId());
            noti.setType("EXAM_CREATED");
            repository.save(noti);

            // b. Gửi Push Notification qua Firebase
            fcmService.sendNotification(dummyStudentId, noti.getTitle(), noti.getMessage());
            
            System.out.println("Processed Exam Event: " + event.getExamId());
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public List<Notification> getUserNotifications(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public void markAsRead(Long notificationId) {
        repository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            repository.save(n);
        });
    }
}