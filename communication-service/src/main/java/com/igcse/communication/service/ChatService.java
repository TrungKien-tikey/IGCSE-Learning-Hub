package com.igcse.communication.service;

import com.igcse.communication.entity.ChatMessage;
import com.igcse.communication.repository.ChatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ChatService {
    @Autowired private ChatRepository repository;

    public ChatMessage sendMessage(ChatMessage message) {
        return repository.save(message);
    }

    public List<ChatMessage> getChatHistory(String roomId) {
        return repository.findByRoomIdOrderByTimestampAsc(roomId);
    }
}