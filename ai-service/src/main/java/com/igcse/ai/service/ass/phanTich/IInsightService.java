package com.igcse.ai.service.ass.phanTich;

import com.igcse.ai.dto.phanTich.AIInsightDTO;

public interface IInsightService {
    AIInsightDTO getInsight(Long studentId);

    AIInsightDTO getInsight(Long studentId, String nifiData);

    AIInsightDTO getInsightByAttempt(Long attemptId);
}
