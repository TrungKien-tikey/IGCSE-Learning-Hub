package com.igcse.ai.strategy;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;


/**
 * Factory để lấy strategy phù hợp dựa trên loại câu hỏi
 */
@Component
public class GradingStrategyFactory {

    private final List<GradingStrategy> strategies;

    @Autowired
    public GradingStrategyFactory(List<GradingStrategy> strategies) {
        this.strategies = strategies;
    }

    public GradingStrategy getStrategy(String answerType) {
        return strategies.stream()
                .filter(strategy -> strategy.supports(answerType))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No strategy found for answer type: " + answerType));
    }
}
