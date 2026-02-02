package com.igcse.payment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity đại diện cho giao dịch mua khóa học của Học sinh từ Giáo viên.
 */
@Entity
@Table(name = "course_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(name = "course_title")
    private String courseTitle;

    @Column(name = "teacher_id", nullable = false)
    private Long teacherId;

    @Column(name = "teacher_name")
    private String teacherName;

    @Column(name = "original_price", precision = 15, scale = 2, nullable = false)
    private BigDecimal originalPrice;

    @Column(name = "discount_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "platform_fee_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal platformFeePercent = new BigDecimal("10.00");

    @Column(name = "platform_fee", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal platformFee = BigDecimal.ZERO;

    @Column(name = "teacher_revenue", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal teacherRevenue = BigDecimal.ZERO;

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

    @PrePersist
    protected void onCreate() {
        this.transactionDate = LocalDateTime.now();
        calculateFees();
    }

    /**
     * Tính toán phí nền tảng và doanh thu giáo viên
     */
    public void calculateFees() {
        if (this.amount != null && this.platformFeePercent != null) {
            // Phí nền tảng = amount * (percent / 100)
            this.platformFee = this.amount.multiply(this.platformFeePercent)
                    .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
            // Doanh thu giáo viên = amount - platformFee
            this.teacherRevenue = this.amount.subtract(this.platformFee);
        }
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
