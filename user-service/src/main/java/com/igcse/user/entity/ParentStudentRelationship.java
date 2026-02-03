package com.igcse.user.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "parent_student_relationships")
public class ParentStudentRelationship {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "parent_id", nullable = false)
    private User parent;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(nullable = false)
    private String status; // PENDING, ACCEPTED, REJECTED, CANCELLED

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    public ParentStudentRelationship() {
    }

    public ParentStudentRelationship(User parent, User student) {
        this.parent = parent;
        this.student = student;
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

    public User getParent() {
        return parent;
    }

    public void setParent(User parent) {
        this.parent = parent;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
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

    // Helper methods for JSON compatibility and ease of use (keeps old frontend
    // working)
    @Transient
    public Long getParentId() {
        return parent != null ? parent.getUserId() : null;
    }

    @Transient
    public Long getStudentId() {
        return student != null ? student.getUserId() : null;
    }
}
