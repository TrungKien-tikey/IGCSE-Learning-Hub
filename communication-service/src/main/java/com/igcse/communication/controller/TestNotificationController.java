package com.igcse.communication.controller;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.TopicManagementResponse;
import com.igcse.communication.config.RabbitMQConfig;
import com.igcse.communication.dto.ExamEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.web.bind.annotation.*;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.TopicManagementResponse;
import java.util.Collections;
import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
@RestController
@RequestMapping("/api/test-notify")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TestNotificationController {

    private final RabbitTemplate rabbitTemplate;

    // API này giả dạng Exam Service bắn tin nhắn đi
    @PostMapping("/send")
    public String triggerFakeExamEvent(@RequestBody ExamEvent mockEvent) {
        
        // Gửi tin nhắn vào Exchange y hệt như Exam Service thật sẽ làm
        rabbitTemplate.convertAndSend(
            RabbitMQConfig.EXCHANGE_NAME,
            RabbitMQConfig.ROUTING_KEY,
            mockEvent
        );

        return "Đã giả lập gửi tin nhắn ExamCreated sang RabbitMQ: " + mockEvent.getExamTitle();
    }
    @PostMapping("/subscribe")
    public String subscribeToTopic(@RequestParam String token, @RequestParam String topic) {
        try {
            // Server dùng quyền Admin để ép token này vào topic
            TopicManagementResponse response = FirebaseMessaging.getInstance()
                    .subscribeToTopic(Collections.singletonList(token), topic);
            
            return "Đã đăng ký thành công: " + response.getSuccessCount() + " thiết bị vào topic: " + topic;
        } catch (Exception e) {
            return "Lỗi đăng ký: " + e.getMessage();
        }
    }
}