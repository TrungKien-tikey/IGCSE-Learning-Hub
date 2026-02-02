package com.igcse.payment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity đại diện cho giao dịch mua suất học của Giáo viên từ Admin.
 */
@Entity
@Table(name = "slot_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlotTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "teacher_id", nullable = false)
    private Long teacherId;

    @Column(name = "teacher_name")
    private String teacherName;

    @Column(name = "package_id", nullable = false)
    private Long packageId;

    @Column(name = "package_name")
    private String packageName;

    @Column(name = "slots_purchased", nullable = false)
    private Integer slotsPurchased;

    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "payment_method")
    @Builder.Default
    private String paymentMethod = "BANK_TRANSFER";

    @Column(name = "payment_status")
    @Builder.Default
    private String paymentStatus = "PENDING";

    @Column(name = "transaction_date")
    private LocalDateTime transactionDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // Relationship
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", insertable = false, updatable = false)
    private CourseSlotPackage slotPackage;

    @PrePersist
    protected void onCreate() {
        this.transactionDate = LocalDateTime.now();
    }

    /**
     * Đánh dấu giao dịch hoàn thành
     */
    public void markAsCompleted() {
        this.paymentStatus = "COMPLETED";
        this.completedAt = LocalDateTime.now();
    }

    /**
     * Đánh dấu giao dịch thất bại
     */
    public void markAsFailed() {
        this.paymentStatus = "FAILED";
    }

    /**
     * Hoàn tiền giao dịch
     */
    public void refund() {
        this.paymentStatus = "REFUNDED";
    }
}
