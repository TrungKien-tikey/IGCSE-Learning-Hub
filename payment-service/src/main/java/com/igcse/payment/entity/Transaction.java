package com.igcse.payment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity bảng tổng hợp giao dịch cho Admin thống kê.
 * Gom tất cả giao dịch từ slot_transactions và course_transactions.
 */
@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_type", nullable = false)
    private String transactionType; // SLOT_PURCHASE, COURSE_ENROLLMENT

    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;

    @Column(name = "buyer_name")
    private String buyerName;

    @Column(name = "buyer_role")
    private String buyerRole; // TEACHER, STUDENT

    @Column(name = "seller_id")
    private Long sellerId; // NULL = Admin

    @Column(name = "seller_name")
    private String sellerName;

    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "platform_revenue", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal platformRevenue = BigDecimal.ZERO;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "payment_status")
    @Builder.Default
    private String paymentStatus = "PENDING";

    @Column(name = "transaction_date")
    private LocalDateTime transactionDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(columnDefinition = "TEXT")
    private String description;

    @PrePersist
    protected void onCreate() {
        this.transactionDate = LocalDateTime.now();
    }

    /**
     * Tạo transaction từ SlotTransaction
     */
    public static Transaction fromSlotTransaction(SlotTransaction st) {
        return Transaction.builder()
                .transactionType("SLOT_PURCHASE")
                .referenceId(st.getId())
                .buyerId(st.getTeacherId())
                .buyerName(st.getTeacherName())
                .buyerRole("TEACHER")
                .sellerId(null) // Admin
                .sellerName("ADMIN")
                .amount(st.getAmount())
                .platformRevenue(st.getAmount()) // Toàn bộ tiền về Admin
                .paymentMethod(st.getPaymentMethod())
                .paymentStatus(st.getPaymentStatus())
                .transactionDate(st.getTransactionDate())
                .completedAt(st.getCompletedAt())
                .description("Mua gói suất học: " + st.getPackageName())
                .build();
    }

    /**
     * Tạo transaction từ CourseTransaction
     */
    public static Transaction fromCourseTransaction(CourseTransaction ct) {
        return Transaction.builder()
                .transactionType("COURSE_ENROLLMENT")
                .referenceId(ct.getId())
                .buyerId(ct.getStudentId())
                .buyerName(ct.getStudentName())
                .buyerRole("STUDENT")
                .sellerId(ct.getTeacherId())
                .sellerName(ct.getTeacherName())
                .amount(ct.getAmount())
                .platformRevenue(ct.getPlatformFee())
                .paymentMethod(ct.getPaymentMethod())
                .paymentStatus(ct.getPaymentStatus())
                .transactionDate(ct.getTransactionDate())
                .completedAt(ct.getCompletedAt())
                .description("Mua khóa học: " + ct.getCourseTitle())
                .build();
    }

    /**
     * Đánh dấu hoàn thành
     */
    public void markAsCompleted() {
        this.paymentStatus = "COMPLETED";
        this.completedAt = LocalDateTime.now();
    }
}
