package com.igcse.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

/**
 * DTO tổng quan doanh thu cho Admin Dashboard
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueOverviewDTO {

    // Tổng doanh thu hệ thống
    private BigDecimal totalRevenue;

    // Tổng doanh thu Admin (platform revenue)
    private BigDecimal totalPlatformRevenue;

    // Doanh thu từ bán suất học
    private BigDecimal slotPurchaseRevenue;

    // Doanh thu từ bán khóa học
    private BigDecimal courseEnrollmentRevenue;

    // Phí nền tảng từ khóa học
    private BigDecimal coursePlatformFee;

    // Tổng số giao dịch
    private Long totalTransactions;

    // Số giao dịch hoàn thành
    private Long completedTransactions;

    // Số giao dịch đang chờ
    private Long pendingTransactions;

    // Doanh thu theo loại giao dịch
    private Map<String, BigDecimal> revenueByType;
}
