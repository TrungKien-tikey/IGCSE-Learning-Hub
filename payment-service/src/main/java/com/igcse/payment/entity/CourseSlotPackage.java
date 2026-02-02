package com.igcse.payment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity đại diện cho các gói suất học mà Admin bán cho Giáo viên.
 * Giáo viên cần mua suất học để có thể tạo khóa học trên hệ thống.
 */
@Entity
@Table(name = "course_slot_packages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseSlotPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "slot_count", nullable = false)
    private Integer slotCount;

    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal price;

    @Column(name = "duration_days")
    @Builder.Default
    private Integer durationDays = 365;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
