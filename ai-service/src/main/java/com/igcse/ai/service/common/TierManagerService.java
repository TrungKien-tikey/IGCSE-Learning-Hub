package com.igcse.ai.service.common;

import com.igcse.ai.dto.aiChamDiem.GradingResult;
import com.igcse.ai.entity.AIPreAnalysis;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.repository.AIPreAnalysisRepository;
import com.igcse.ai.repository.AIInsightRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TierManagerService {
    private static final Logger logger = LoggerFactory.getLogger(TierManagerService.class);

    private final AIPreAnalysisRepository aiPreAnalysisRepository;
    private final AIInsightRepository aiInsightRepository;
    private final JsonService jsonService;

    @Value("${ai.analysis.tier2.exam-threshold:3}")
    private int tier2Threshold;

    @Value("${ai.analysis.tier2.score-drop-threshold:0.3}")
    private double scoreDropThreshold;

    public TierManagerService(AIPreAnalysisRepository aiPreAnalysisRepository,
            AIInsightRepository aiInsightRepository,
            JsonService jsonService) {
        this.aiPreAnalysisRepository = aiPreAnalysisRepository;
        this.aiInsightRepository = aiInsightRepository;
        this.jsonService = jsonService;
    }

    /**
     * Dữ liệu phân tích dùng chung
     */
    public record AnalysisData(
            double avgScore,
            double passRate,
            int totalExams,
            List<String> strengths,
            List<String> weaknesses) {
    }

    @Transactional
    public void updateTier1Counter(Long studentId, AnalysisData data, String logicFeedback, List<String> strengths,
            List<String> weaknesses) {
        AIPreAnalysis pre = aiPreAnalysisRepository.findTopByStudentIdOrderByGeneratedAtDesc(studentId)
                .orElse(new AIPreAnalysis());

        pre.setStudentId(studentId);
        pre.setAvgScore(data.avgScore());
        pre.setLogicFeedback(logicFeedback);

        try {
            pre.setKeyStrengths(jsonService.toJson(strengths));
            pre.setKeyWeaknesses(jsonService.toJson(weaknesses));
        } catch (Exception e) {
            logger.error("Error serializing Tier 1 JSON", e);
        }

        int oldCount = pre.getExamCountSinceLastAi() != null ? pre.getExamCountSinceLastAi() : 0;
        pre.setExamCountSinceLastAi(oldCount + 1);
        pre.setGeneratedAt(new Date());

        aiPreAnalysisRepository.save(pre);
        logger.info("Tier 1 updated for student {}. Counter: {}", studentId, pre.getExamCountSinceLastAi());
    }

    public boolean shouldTriggerTier2(Long studentId, double currentAvgScore) {
        Optional<AIPreAnalysis> preOpt = aiPreAnalysisRepository.findTopByStudentIdOrderByGeneratedAtDesc(studentId);
        if (preOpt.isEmpty())
            return true;

        AIPreAnalysis pre = preOpt.get();

        // 1. Kiểm tra ngưỡng số bài thi
        if (pre.getExamCountSinceLastAi() >= tier2Threshold) {
            logger.info("Tier 2 Trigger: Exam threshold reached ({})", pre.getExamCountSinceLastAi());
            return true;
        }

        // 2. Priority Trigger: Điểm giảm đột ngột
        if (pre.getAvgScore() != null && pre.getAvgScore() > 0) {
            double drop = (pre.getAvgScore() - currentAvgScore) / pre.getAvgScore();
            if (drop >= scoreDropThreshold) {
                logger.info("Priority Trigger: Score dropped by {}%. Forcing AI.", Math.round(drop * 100));
                return true;
            }
        }

        // 3. Cooldown 1 giờ để tránh spam AI
        long oneHour = 3600000;
        return aiInsightRepository.findTopByStudentIdOrderByGeneratedAtDesc(studentId)
                .map(latest -> (System.currentTimeMillis() - latest.getGeneratedAt().getTime()) > oneHour)
                .orElse(true);
    }

    @Transactional
    public void resetCounter(Long studentId) {
        aiPreAnalysisRepository.findTopByStudentIdOrderByGeneratedAtDesc(studentId)
                .ifPresent(pre -> {
                    pre.setExamCountSinceLastAi(0);
                    aiPreAnalysisRepository.save(pre);
                });
    }

    public AnalysisData analyzeResults(List<AIResult> results) {
        if (results.isEmpty())
            return new AnalysisData(0, 0, 0, List.of(), List.of());

        double avgScore = results.stream()
                .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0.0)
                .average().orElse(0.0);

        long passCount = results.stream().filter(AIResult::isPassed).count();
        double passRate = (double) passCount / results.size() * 100;

        List<String> strengths = new ArrayList<>();
        List<String> weaknesses = new ArrayList<>();

        for (AIResult r : results) {
            List<GradingResult> details = jsonService.parseGradingDetails(r.getDetails());
            for (GradingResult gr : details) {
                if (gr.getScore() != null && gr.getMaxScore() != null && gr.getMaxScore() > 0) {
                    double pct = (gr.getScore() / gr.getMaxScore()) * 100;
                    if (pct >= 80)
                        strengths.add("Câu " + gr.getQuestionId());
                    else if (pct < 50)
                        weaknesses.add("Câu " + gr.getQuestionId());
                }
            }
        }

        return new AnalysisData(
                avgScore, passRate, results.size(),
                strengths.stream().distinct().limit(5).collect(Collectors.toList()),
                weaknesses.stream().distinct().limit(5).collect(Collectors.toList()));
    }
}
