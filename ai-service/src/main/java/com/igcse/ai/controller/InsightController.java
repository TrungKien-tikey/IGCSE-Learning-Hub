package com.igcse.ai.controller;

import com.igcse.ai.dto.AIInsightDTO;
import com.igcse.ai.service.analytics.IInsightService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/insights")
public class InsightController {

    private final IInsightService insightService;

    @Autowired
    public InsightController(IInsightService insightService) {
        this.insightService = insightService;
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<AIInsightDTO> getInsight(@PathVariable Long studentId) {
        return ResponseEntity.ok(insightService.getInsight(studentId));
    }
}
