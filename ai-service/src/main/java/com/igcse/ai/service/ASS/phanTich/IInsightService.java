package com.igcse.ai.service.ASS.phanTich;

import com.igcse.ai.dto.phanTich.AIInsightDTO;

public interface IInsightService {
    AIInsightDTO getInsight(Long studentId);
}
