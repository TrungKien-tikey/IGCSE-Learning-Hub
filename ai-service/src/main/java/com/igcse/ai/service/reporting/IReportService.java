package com.igcse.ai.service.reporting;

public interface IReportService {
    byte[] generateStudentReport(Long studentId, String format);

    byte[] generateClassReport(Long classId, String format);
}
