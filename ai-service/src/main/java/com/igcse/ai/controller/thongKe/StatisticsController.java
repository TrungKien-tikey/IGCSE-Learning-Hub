package com.igcse.ai.controller.thongKe;

import com.igcse.ai.dto.thongKe.ClassStatisticsDTO;
import com.igcse.ai.dto.thongKe.StudentStatisticsDTO;
import com.igcse.ai.service.ass.thongKe.IStatisticsService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/ai/statistics")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "http://localhost:5173",
        "http://localhost:5174", "http://127.0.0.1:3000", "http://127.0.0.1:5173", "http://127.0.0.1:5174" })
public class StatisticsController {

    private final IStatisticsService statisticsService;

    public StatisticsController(IStatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<StudentStatisticsDTO> getStudentStatistics(@PathVariable Long studentId) {
        return ResponseEntity.ok(statisticsService.getStudentStatistics(studentId));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<ClassStatisticsDTO> getClassStatistics(@PathVariable Long classId) {
        return ResponseEntity.ok(statisticsService.getClassStatistics(classId));
    }

    @GetMapping("/system")
    public ResponseEntity<Map<String, Object>> getSystemStatistics() {
        return ResponseEntity.ok(statisticsService.getSystemStatistics());
    }
}
