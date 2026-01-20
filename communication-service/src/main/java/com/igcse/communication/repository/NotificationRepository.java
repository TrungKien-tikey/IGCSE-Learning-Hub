package com.igcse.communication.repository;

import com.igcse.communication.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // 👇 SỬA DÒNG NÀY: Thêm đoạn "OR n.userId = 0"
    @Query("SELECT n FROM Notification n WHERE (n.userId = :userId OR n.userId = 0) ORDER BY n.isRead ASC, n.createdAt DESC")
    List<Notification> findMyNotifications(Long userId);
}