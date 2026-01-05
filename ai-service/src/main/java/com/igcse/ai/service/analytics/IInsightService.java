package com.igcse.ai.service.analytics;

import com.igcse.ai.dto.AIInsightDTO;

public interface IInsightService {
    AIInsightDTO getInsight(Long studentId);
}
