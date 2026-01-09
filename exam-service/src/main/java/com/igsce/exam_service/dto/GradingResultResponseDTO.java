package com.igsce.exam_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO cho callback từ AI Service
 * Trả về kết quả cập nhật điểm chấm
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GradingResultResponseDTO {
    private boolean success;
    private String message;
    private Long attemptId;

    /**
     * Tạo response thành công
     */
    public static GradingResultResponseDTO success(Long attemptId) {
        return new GradingResultResponseDTO(
                true,
                "Cập nhật kết quả chấm điểm thành công",
                attemptId);
    }

    /**
     * Tạo response thất bại
     */
    public static GradingResultResponseDTO failure(Long attemptId, String reason) {
        return new GradingResultResponseDTO(
                false,
                "Cập nhật kết quả chấm điểm thất bại: " + reason,
                attemptId);
    }
}
