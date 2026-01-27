package com.igcse.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * Entity lưu trữ bối cảnh học tập (Study Context) của học sinh.
 * Dữ liệu này được đẩy từ NiFi và lưu trữ lâu dài để AI có "trí nhớ".
 */
@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "study_contexts")
public class StudyContext {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false, unique = true)
    private Long studentId;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "class_id")
    private Long classId;

    @Column(name = "course_title")
    private String courseTitle;

    @Column(name = "persona", columnDefinition = "TEXT")
    private String persona;

    /**
     * Dữ liệu bối cảnh chi tiết dưới dạng JSON String.
     * Lưu trữ mọi thông tin phụ trợ từ NiFi (persona, chuyên cần, nhận xét cũ...).
     */
    @Column(name = "context_data", columnDefinition = "TEXT")
    private String contextData;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private Date updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = new Date();
    }
}
