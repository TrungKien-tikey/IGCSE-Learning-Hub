package com.igcse.ai.service.thongKe;

import com.igcse.ai.dto.thongKe.ClassStatisticsDTO;

import com.igcse.ai.dto.thongKe.LearningAnalyticsDTO;
import com.igcse.ai.dto.thongKe.ParentSummaryDTO;
import com.igcse.ai.dto.thongKe.StudentStatisticsDTO;

import java.util.Map;

public interface IStatisticsService {
    StudentStatisticsDTO getStudentStatistics(Long studentId);

    ClassStatisticsDTO getClassStatistics(Long classId);

    Map<String, Object> getSystemStatistics();

    // New Advanced Analytics
    LearningAnalyticsDTO getLearningAnalytics(Long studentId);

    ParentSummaryDTO getParentSummary(Long studentId);

    // Exam-centric Statistics
    com.igcse.ai.dto.thongKe.ExamStatisticsDTO getExamStatistics(Long examId, Long classId);

    java.util.List<Long> getParticipatedExamIds(Long classId);
}
