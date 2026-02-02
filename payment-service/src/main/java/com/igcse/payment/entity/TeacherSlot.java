package com.igcse.payment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity quản lý số suất học của mỗi Giáo viên.
 * Mỗi giáo viên có một record duy nhất.
 */
@Entity
@Table(name = "teacher_slots")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "teacher_id", nullable = false, unique = true)
    private Long teacherId;

    @Column(name = "teacher_name")
    private String teacherName;

    @Column(name = "total_slots")
    @Builder.Default
    private Integer totalSlots = 0;

    @Column(name = "used_slots")
    @Builder.Default
    private Integer usedSlots = 0;

    @Column(name = "available_slots")
    @Builder.Default
    private Integer availableSlots = 0;

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

    /**
     * Thêm suất học khi giáo viên mua gói mới
     */
    public void addSlots(int count) {
        this.totalSlots += count;
        this.availableSlots += count;
    }

    /**
     * Sử dụng suất học khi tạo khóa học mới
     * 
     * @return true nếu còn suất, false nếu hết
     */
    public boolean useSlot() {
        if (this.availableSlots > 0) {
            this.usedSlots++;
            this.availableSlots--;
            return true;
        }
        return false;
    }

    /**
     * Hoàn trả suất học khi xóa khóa học
     */
    public void returnSlot() {
        if (this.usedSlots > 0) {
            this.usedSlots--;
            this.availableSlots++;
        }
    }

    /**
     * Kiểm tra còn suất học không
     */
    public boolean hasAvailableSlots() {
        return this.availableSlots > 0;
    }
}
