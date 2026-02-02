package com.igcse.user.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "parent_student_relationships")
public class ParentStudentRelationship {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "parent_id", nullable = false)
    private Long parentId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(nullable = false)
    private String status; // PENDING, ACCEPTED, REJECTED

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    public ParentStudentRelationship() {
    }

    public ParentStudentRelationship(Long parentId, Long studentId) {
        this.parentId = parentId;
        this.studentId = studentId;
        this.status = "PENDING";
        this.createdAt = new Date();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
}
