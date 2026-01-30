package com.igcse.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO thông tin doanh thu giáo viên
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherRevenueDTO {

    private Long teacherId;
    private String teacherName;
    private BigDecimal totalRevenue;
    private String totalRevenueFormatted;
    private Long coursesSold;
    private Integer rank;

    /**
     * Format doanh thu VNĐ
     */
    public String getTotalRevenueFormatted() {
        if (totalRevenue == null)
            return "0 ₫";
        return String.format("%,.0f ₫", totalRevenue);
    }
}
