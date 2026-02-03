package com.igcse.communication.controller;

import lombok.extern.slf4j.Slf4j;

import com.igcse.communication.entity.ChatMessage;
import com.igcse.communication.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@Slf4j
public class ChatController {
    @Autowired
    private ChatService service;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping("/send")
    public ChatMessage sendMessage(@RequestBody ChatMessage message) {
        return service.sendMessage(message);
    }

    @GetMapping("/history/{roomId}")
    public List<ChatMessage> getChatHistory(@PathVariable String roomId) {
        return service.getChatHistory(roomId);
    }

    @SubscribeMapping("/history/{roomId}")
    public List<ChatMessage> sendHistoryOnSubscribe(@DestinationVariable String roomId) {
        log.debug("User subscribed to room: {}", roomId);

        List<ChatMessage> list = service.getChatHistory(roomId);
        log.debug("Found {} messages for room {}", list.size(), roomId);
        return list;
    }

    @MessageMapping("/private-message")
    public ChatMessage receivePrivateMessage(@Payload ChatMessage message) {
        // Lưu tin nhắn vào DB
        ChatMessage savedMsg = service.sendMessage(message);

        // Gửi tin nhắn đến người nhận cụ thể.
        // Client của receiverId cần subscribe vào: /queue/messages/{receiverId}
        messagingTemplate.convertAndSend("/queue/messages/" + message.getReceiverId(), savedMsg);

        // (Tùy chọn) Gửi lại cho người gửi để hiện lên giao diện của họ ngay lập tức
        messagingTemplate.convertAndSend("/queue/messages/" + message.getSenderId(), savedMsg);

        return savedMsg;
    }
}