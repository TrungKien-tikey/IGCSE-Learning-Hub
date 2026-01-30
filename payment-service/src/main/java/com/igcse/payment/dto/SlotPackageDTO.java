package com.igcse.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO thông tin gói suất học
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlotPackageDTO {

    private Long id;
    private String name;
    private String description;
    private Integer slotCount;
    private BigDecimal price;
    private String priceFormatted;
    private Integer durationDays;
    private Boolean isActive;

    /**
     * Format giá tiền VNĐ
     */
    public String getPriceFormatted() {
        if (price == null)
            return "0 ₫";
        return String.format("%,.0f ₫", price);
    }
}
