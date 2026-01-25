package com.igcse.communication.controller;

import com.igcse.communication.entity.Comment;
import com.igcse.communication.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @GetMapping("/exam/{examId}")
    public ResponseEntity<List<Comment>> getComments(@PathVariable Long examId) {
        return ResponseEntity.ok(commentService.getCommentsByExam(examId));
    }

    @PostMapping
    public ResponseEntity<Comment> createComment(@RequestBody Comment comment) {
        return ResponseEntity.ok(commentService.saveComment(comment));
    }
}