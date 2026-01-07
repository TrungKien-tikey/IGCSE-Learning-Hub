package com.igcse.ai.controller;

import com.igcse.ai.dto.ClassStatisticsDTO;
import com.igcse.ai.dto.StudentStatisticsDTO;
import com.igcse.ai.service.analytics.IStatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/ai/statistics")
public class StatisticsController {

    private final IStatisticsService statisticsService;

    @Autowired
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
