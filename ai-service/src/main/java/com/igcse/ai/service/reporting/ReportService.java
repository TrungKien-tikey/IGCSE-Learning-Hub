package com.igcse.ai.service.reporting;

import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;

@Service
public class ReportService implements IReportService {

    @Override
    public byte[] generateStudentReport(Long studentId, String format) {
        // Mock PDF/JSON generation
        String content = "Report for student " + studentId + " in " + format;
        return content.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public byte[] generateClassReport(Long classId, String format) {
        // Mock PDF/JSON generation
        String content = "Report for class " + classId + " in " + format;
        return content.getBytes(StandardCharsets.UTF_8);
    }
}
