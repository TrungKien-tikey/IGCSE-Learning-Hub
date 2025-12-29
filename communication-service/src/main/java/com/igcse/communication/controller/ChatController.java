package com.igcse.communication.controller;

import com.igcse.communication.entity.ChatMessage;
import com.igcse.communication.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    @Autowired private ChatService service;

    @PostMapping("/send")
    public ChatMessage sendMessage(@RequestBody ChatMessage message) {
        return service.sendMessage(message);
    }

    @GetMapping("/history/{roomId}")
    public List<ChatMessage> getChatHistory(@PathVariable String roomId) {
        return service.getChatHistory(roomId);
    }
}