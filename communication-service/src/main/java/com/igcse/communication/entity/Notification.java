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
    private boolean isRead;
    private LocalDateTime createdAt;
    
    // Loại bỏ courseId
}