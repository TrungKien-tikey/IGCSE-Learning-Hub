package com.igcse.payment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO request mua khóa học
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseCourseRequestDTO {

    @NotNull(message = "Student ID không được để trống")
    private Long studentId;

    private String studentName;

    @NotNull(message = "Course ID không được để trống")
    private Long courseId;

    private String courseTitle;

    @NotNull(message = "Teacher ID không được để trống")
    private Long teacherId;

    private String teacherName;

    @NotNull(message = "Giá khóa học không được để trống")
    private BigDecimal originalPrice;

    private BigDecimal discountAmount;

    private String paymentMethod;

    private String notes;
}
