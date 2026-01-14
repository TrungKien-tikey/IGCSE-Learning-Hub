package com.igcse.ai.controller.aiChamDiem;

import com.igcse.ai.dto.thongKe.ClassStatisticsDTO;
import com.igcse.ai.dto.thongKe.StudentStatisticsDTO;
import com.igcse.ai.service.ass.thongKe.IStatisticsService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai/statistics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
public class StatisticsController {
    private static final Logger logger = LoggerFactory.getLogger(StatisticsController.class);
    private final IStatisticsService statisticsService;

    @GetMapping("/student/{studentId}")
    public ResponseEntity<StudentStatisticsDTO> getStudentStatistics(@PathVariable Long studentId) {
        return ResponseEntity.ok(statisticsService.getStudentStatistics(studentId));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<ClassStatisticsDTO> getClassStatistics(@PathVariable Long classId) {
        logger.info("Teacher Dashboard: Fetching stats for class {}", classId);
        return ResponseEntity.ok(statisticsService.getClassStatistics(classId));
    }

    @GetMapping("/system")
    public ResponseEntity<Map<String, Object>> getSystemStatistics() {
        return ResponseEntity.ok(statisticsService.getSystemStatistics());
    }
}
