package com.igcse.ai.controller;

import com.igcse.ai.service.reporting.IReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/reports")
public class ReportController {

    private final IReportService reportService;

    @Autowired
    public ReportController(IReportService reportService) {
        this.reportService = reportService;
    }

    @SuppressWarnings("null")
    @GetMapping("/student/{studentId}/export")
    public ResponseEntity<byte[]> exportStudentReport(
            @PathVariable Long studentId,
            @RequestParam(defaultValue = "pdf") String format) {

        byte[] content = reportService.generateStudentReport(studentId, format);
        String filename = "report_student_" + studentId + "." + format;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(content);
    }

    @SuppressWarnings("null")
    @GetMapping("/class/{classId}/export")
    public ResponseEntity<byte[]> exportClassReport(
            @PathVariable Long classId,
            @RequestParam(defaultValue = "pdf") String format) {

        byte[] content = reportService.generateClassReport(classId, format);
        String filename = "report_class_" + classId + "." + format;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(content);
    }
}
