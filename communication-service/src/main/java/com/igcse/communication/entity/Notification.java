package com.igcse.communication.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId; // Người nhận thông báo
    private String title;
    private String message;
    @Column(name = "notification_type") 
    private String type;
    @Column(name = "exam_id")
    private Long examId;
    // Trong file com.igcse.communication.entity.Notification.java
    @Builder.Default
    private boolean isRead = false; 
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now(); 
    // Loại bỏ courseId
}