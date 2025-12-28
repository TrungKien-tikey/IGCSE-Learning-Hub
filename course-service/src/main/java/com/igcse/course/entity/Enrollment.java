package com.igcse.course.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "enrollments")
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long enrollmentId;

    private Long userId; // Chỉ lưu ID user
    private Date enrolledAt = new Date();

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    // --- Getters & Setters ---
    public Long getEnrollmentId() { return enrollmentId; }
    public void setEnrollmentId(Long enrollmentId) { this.enrollmentId = enrollmentId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Date getEnrolledAt() { return enrolledAt; }
    public void setEnrolledAt(Date enrolledAt) { this.enrolledAt = enrolledAt; }
    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }
}