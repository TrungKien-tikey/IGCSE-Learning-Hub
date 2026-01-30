package com.igcse.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO doanh thu theo tháng
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyRevenueDTO {

    private Integer month;
    private String monthName;
    private BigDecimal totalRevenue;
    private BigDecimal platformRevenue;
    private Long transactionCount;

    public MonthlyRevenueDTO(Integer month, BigDecimal totalRevenue) {
        this.month = month;
        this.totalRevenue = totalRevenue;
        this.monthName = getVietnameseMonthName(month);
    }

    private String getVietnameseMonthName(int month) {
        String[] months = {
                "", "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
                "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
        };
        return month >= 1 && month <= 12 ? months[month] : "Không xác định";
    }
}
