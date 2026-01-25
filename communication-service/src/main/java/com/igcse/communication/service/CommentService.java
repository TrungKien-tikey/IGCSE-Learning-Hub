package com.igcse.communication.service;

import com.igcse.communication.entity.Comment;
import com.igcse.communication.repository.CommentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Comment saveComment(Comment comment) {
        Comment saved = commentRepository.save(comment);
        
        // Gửi Realtime qua WebSocket sử dụng examId
        messagingTemplate.convertAndSend("/topic/comments/" + saved.getExamId(), saved);
        
        return saved;
    }

    public List<Comment> getCommentsByExam(Long examId) {
        return commentRepository.findByExamIdOrderByCreatedAtDesc(examId);
    }

    @Transactional
    public void deleteComment(Long id) {
        commentRepository.deleteById(id);
    }
}