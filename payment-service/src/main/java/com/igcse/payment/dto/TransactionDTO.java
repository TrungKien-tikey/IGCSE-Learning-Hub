package com.igcse.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO hiển thị thông tin giao dịch
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionDTO {

    private Long id;
    private String transactionType;
    private Long referenceId;

    private Long buyerId;
    private String buyerName;
    private String buyerRole;

    private Long sellerId;
    private String sellerName;

    private BigDecimal amount;
    private BigDecimal platformRevenue;

    private String paymentMethod;
    private String paymentStatus;

    private LocalDateTime transactionDate;
    private LocalDateTime completedAt;

    private String description;

    /**
     * Chuyển đổi loại giao dịch sang tiếng Việt
     */
    public String getTransactionTypeDisplay() {
        if (transactionType == null)
            return "";
        return switch (transactionType) {
            case "SLOT_PURCHASE" -> "Mua suất học";
            case "COURSE_ENROLLMENT" -> "Mua khóa học";
            default -> transactionType;
        };
    }

    /**
     * Chuyển đổi phương thức thanh toán sang tiếng Việt
     */
    public String getPaymentMethodDisplay() {
        if (paymentMethod == null)
            return "";
        return switch (paymentMethod) {
            case "BANK_TRANSFER" -> "Chuyển khoản";
            case "MOMO" -> "Ví MoMo";
            case "VNPAY" -> "VNPay";
            case "CASH" -> "Tiền mặt";
            default -> paymentMethod;
        };
    }

    /**
     * Chuyển đổi trạng thái sang tiếng Việt
     */
    public String getPaymentStatusDisplay() {
        if (paymentStatus == null)
            return "";
        return switch (paymentStatus) {
            case "PENDING" -> "Đang chờ";
            case "COMPLETED" -> "Hoàn thành";
            case "FAILED" -> "Thất bại";
            case "REFUNDED" -> "Đã hoàn tiền";
            default -> paymentStatus;
        };
    }
}
