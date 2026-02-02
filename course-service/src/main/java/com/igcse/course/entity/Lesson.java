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

    // --- CÁC TRƯỜNG LƯU LINK & FILE ---
    
    private String videoUrl;    // Lưu link Youtube

    @Lob
    @Column(columnDefinition = "TEXT") // Link Cloudinary thường rất dài nên dùng TEXT
    private String resourceUrl; // Lưu URL của file tài liệu (PDF, Docx...)

    private String resourceName; // MỚI: Lưu tên file gốc (VD: "bai_tap_1.pdf") để hiển thị và quản lý xóa

    @ManyToOne
    @JoinColumn(name = "course_id")
    @JsonIgnore // Không hiện ngược lại Course khi xem Lesson để tránh vòng lặp JSON
    private Course course;

    // --- Constructor ---
    public Lesson() {}

    // --- Business Method (Cập nhật logic nghiệp vụ) ---
    public void updateLesson(String title, String content, Integer orderIndex, String videoUrl, String resourceUrl, String resourceName) {
        if (title != null) this.title = title;
        if (content != null) this.content = content;
        if (orderIndex != null) this.orderIndex = orderIndex;
        
        // Luôn cập nhật hoặc xóa (nếu null) các trường này
        this.videoUrl = videoUrl;
        this.resourceUrl = resourceUrl;
        this.resourceName = resourceName;
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

    public String getResourceName() { return resourceName; }
    public void setResourceName(String resourceName) { this.resourceName = resourceName; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }
}