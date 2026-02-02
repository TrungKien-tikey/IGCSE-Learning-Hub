package com.igcse.ai.service.phanTich;

import com.igcse.ai.dto.phanTich.AIInsightDTO;

public interface IInsightService {
    /**
     * Dùng cho Dashboard: lấy insight hiện tại (ưu tiên cache, không cần NiFi).
     */
    AIInsightDTO getInsight(Long studentId);

    /**
     * Dùng cho NiFi / tác vụ nền: cập nhật lại insight dựa trên dữ liệu mới.
     */
    void triggerUpdate(Long studentId, String nifiData);

    /**
     * Lấy insight cho một lần làm bài cụ thể.
     */
    AIInsightDTO getInsightByAttempt(Long attemptId);

    /**
     * Kích hoạt phân tích sâu chủ động (chạy nền) để dữ liệu sẵn sàng ngay sau khi
     * chấm điểm.
     */
    @org.springframework.scheduling.annotation.Async
    void triggerProactiveAnalysis(Long studentId, Long attemptId);
}
