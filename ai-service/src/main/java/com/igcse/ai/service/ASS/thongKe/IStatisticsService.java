package com.igcse.ai.service.ass.thongKe;

import com.igcse.ai.dto.thongKe.ClassStatisticsDTO;
import com.igcse.ai.dto.thongKe.StudentStatisticsDTO;

import java.util.Map;

public interface IStatisticsService {
    StudentStatisticsDTO getStudentStatistics(Long studentId);

    ClassStatisticsDTO getClassStatistics(Long classId);

    Map<String, Object> getSystemStatistics();
}
