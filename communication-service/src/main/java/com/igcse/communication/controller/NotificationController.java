package com.igcse.communication.controller;

import com.igcse.communication.entity.Notification;
import com.igcse.communication.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    @Autowired private NotificationService service;

    @GetMapping("/{userId}")
    public List<Notification> getAllNotifications(@PathVariable Long userId) {
        return service.getUserNotifications(userId);
    }

    @PutMapping("/{id}/read")
    public void markAsRead(@PathVariable Long id) {
        service.markAsRead(id);
    }
}