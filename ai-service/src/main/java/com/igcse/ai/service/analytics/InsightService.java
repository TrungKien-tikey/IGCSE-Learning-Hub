package com.igcse.ai.service.analytics;

import com.igcse.ai.dto.AIInsightDTO;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
public class InsightService implements IInsightService {

    @Override
    public AIInsightDTO getInsight(Long studentId) {
        // Mock data based on FE
        AIInsightDTO insight = new AIInsightDTO();
        insight.setStudentId(studentId);
        insight.setOverallSummary(
                "Con bạn đang có tiến bộ tốt! Trong 2 tuần qua, điểm số cải thiện 5%. Đặc biệt xuất sắc ở môn Toán và Hóa học.");
        insight.setKeyStrengths(Arrays.asList("Tư duy logic tốt", "Hoàn thành bài tập đúng hạn"));
        insight.setAreasForImprovement(
                Arrays.asList("Cần cẩn thận hơn trong tính toán", "Dành thêm thời gian cho môn Vật lý"));
        insight.setActionPlan("Duy trì phong độ môn Toán, tăng cường làm bài tập Vật lý 30 phút mỗi ngày.");
        return insight;
    }
}
