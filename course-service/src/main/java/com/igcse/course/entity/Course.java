package com.igcse.course.entity;

import jakarta.persistence.*;
import java.util.Date;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long courseId;
    @Column(name = "created_by")
    private Long createdBy;

    private String title;

    @Column(length = 1000) // Mô tả có thể dài
    private String description;

    private Double price;
    private boolean isActive = true;
    private Date createdAt = new Date();
    @Column(name = "duration")
    private String duration;
    private Long teacherId;
    @Column(name = "status")
    private String status = "DRAFT";

    // Quan hệ 1-Nhiều với Lesson
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    @JsonIgnore // Tránh vòng lặp vô tận khi convert sang JSON
    private List<Lesson> lessons;

    // Quan hệ 1-Nhiều với Enrollment
    @OneToMany(mappedBy = "course")
    @JsonIgnore
    private List<Enrollment> enrollments;

    // --- Constructor ---
    public Course() {
    }

    // --- Business Methods (Logic nghiệp vụ tại Entity) ---
    public void updateCourse(String title, String description, Double price, String duration) {
        if (title != null && !title.isEmpty())
            this.title = title;
        if (description != null)
            this.description = description;
        if (price != null)
            this.price = price;
        if (duration != null && !duration.isEmpty())
            this.duration = duration;
    }

    public void deactivate() {
        this.isActive = false;
    }

    // --- Getters & Setters ---
    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public List<Lesson> getLessons() {
        return lessons;
    }

    public void setLessons(List<Lesson> lessons) {
        this.lessons = lessons;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public Long getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }
}
