package com.igcse.ai.service.analytics;

import com.igcse.ai.dto.ClassStatisticsDTO;
import com.igcse.ai.dto.StudentStatisticsDTO;

import java.util.Map;

public interface IStatisticsService {
    StudentStatisticsDTO getStudentStatistics(Long studentId);

    ClassStatisticsDTO getClassStatistics(Long classId);

    Map<String, Object> getSystemStatistics();
}
