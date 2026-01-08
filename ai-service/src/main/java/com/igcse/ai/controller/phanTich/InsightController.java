package com.igcse.ai.controller.phanTich;

import com.igcse.ai.dto.phanTich.AIInsightDTO;
import com.igcse.ai.service.ass.phanTich.IInsightService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/insights")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "http://localhost:5173",
        "http://localhost:5174", "http://127.0.0.1:3000", "http://127.0.0.1:5173", "http://127.0.0.1:5174" })
public class InsightController {

    private final IInsightService insightService;

    public InsightController(IInsightService insightService) {
        this.insightService = insightService;
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<AIInsightDTO> getInsight(@PathVariable Long studentId) {
        return ResponseEntity.ok(insightService.getInsight(studentId));
    }

    @GetMapping("/attempt/{attemptId}")
    public ResponseEntity<AIInsightDTO> getInsightByAttempt(@PathVariable Long attemptId) {
        return ResponseEntity.ok(insightService.getInsightByAttempt(attemptId));
    }
}
