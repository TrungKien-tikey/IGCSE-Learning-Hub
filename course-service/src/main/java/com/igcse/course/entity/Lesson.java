package com.igcse.course.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

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

    private String videoUrl; // Lưu link Youtube

    @Lob
    @Column(columnDefinition = "TEXT") // Link Cloudinary thường rất dài nên dùng TEXT
    private String resourceUrl; // Lưu URL của file tài liệu (PDF, Docx...)

    private String resourceName; // MỚI: Lưu tên file gốc (VD: "bai_tap_1.pdf") để hiển thị và quản lý xóa
    @Column(columnDefinition = "TEXT")
    private String meetingUrl;

    private LocalDateTime startTime;

    @ManyToOne
    @JoinColumn(name = "course_id")
    @JsonIgnore // Không hiện ngược lại Course khi xem Lesson để tránh vòng lặp JSON
    private Course course;

    // --- Constructor ---
    public Lesson() {
    }

    // --- Business Method (Cập nhật logic nghiệp vụ) ---
    public void updateLesson(String title, String content, Integer orderIndex, 
                             String videoUrl, String resourceUrl, String resourceName, 
                             String meetingUrl, LocalDateTime startTime) { // <--- THÊM 2 THAM SỐ NÀY
        if (title != null) this.title = title;
        if (content != null) this.content = content;
        if (orderIndex != null) this.orderIndex = orderIndex;
        
        // Cập nhật các trường link và tài liệu
        this.videoUrl = videoUrl;
        this.resourceUrl = resourceUrl;
        this.resourceName = resourceName;
        
        // Cập nhật 2 trường mới cho lớp học trực tuyến
        this.meetingUrl = meetingUrl;
        this.startTime = startTime;
    }

    // --- Getters & Setters ---
    public Long getLessonId() {
        return lessonId;
    }

    public void setLessonId(Long lessonId) {
        this.lessonId = lessonId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Integer getOrderIndex() {
        return orderIndex;
    }

    public void setOrderIndex(Integer orderIndex) {
        this.orderIndex = orderIndex;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public String getResourceUrl() {
        return resourceUrl;
    }

    public void setResourceUrl(String resourceUrl) {
        this.resourceUrl = resourceUrl;
    }

    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    // --- GETTER & SETTER CHO 2 TRƯỜNG MỚI ---
    public String getMeetingUrl() {
        return meetingUrl;
    }

    public void setMeetingUrl(String meetingUrl) {
        this.meetingUrl = meetingUrl;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
}