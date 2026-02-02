package com.igcse.course.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_progress")
public class LessonProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;   // ID của học sinh
    private Long lessonId; // ID của bài học
    private Long courseId; // ID của khóa học (để tính tiến độ nhanh hơn)

    private boolean isCompleted = false;
    private LocalDateTime completedAt;

    public LessonProgress() {}

    public LessonProgress(Long userId, Long lessonId, Long courseId) {
        this.userId = userId;
        this.lessonId = lessonId;
        this.courseId = courseId;
        this.isCompleted = true;
        this.completedAt = LocalDateTime.now();
    }

    // --- CÁC HÀM GETTER / SETTER ---

    // QUAN TRỌNG: Phải có 2 hàm này để Service không bị lỗi
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public boolean isCompleted() { return isCompleted; }
    public void setCompleted(boolean completed) { isCompleted = completed; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}