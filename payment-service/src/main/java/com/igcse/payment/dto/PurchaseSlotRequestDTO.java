package com.igcse.payment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO request mua suất học
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseSlotRequestDTO {

    @NotNull(message = "Teacher ID không được để trống")
    private Long teacherId;

    private String teacherName;

    @NotNull(message = "Package ID không được để trống")
    private Long packageId;

    private String paymentMethod;

    private String notes;
}
