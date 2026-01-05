package com.igcse.course.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "lessons")
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long lessonId;

    private String title;

    @Lob // Cho phép lưu nội dung văn bản cực dài
    @Column(columnDefinition = "TEXT")
    private String content;

    private Integer orderIndex;

    // --- MỚI THÊM: 2 Trường lưu Link ---
    private String videoUrl;    // Link Youtube
    private String resourceUrl; // Link Drive/PDF

    @ManyToOne
    @JoinColumn(name = "course_id")
    @JsonIgnore // Không hiện ngược lại Course khi xem Lesson
    private Course course;

    // --- Constructor ---
    public Lesson() {}

    // --- Business Method ---
    public void updateLesson(String title, String content, Integer orderIndex,String videoUrl, String resourceUrl) {
        if (title != null) this.title = title;
        if (content != null) this.content = content;
        if (orderIndex != null) this.orderIndex = orderIndex;
        // Logic mới
        if (videoUrl != null) this.videoUrl = videoUrl;
        if (resourceUrl != null) this.resourceUrl = resourceUrl;
    }

    // --- Getters & Setters ---
    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public String getResourceUrl() { return resourceUrl; }
    public void setResourceUrl(String resourceUrl) { this.resourceUrl = resourceUrl; }
    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }
}