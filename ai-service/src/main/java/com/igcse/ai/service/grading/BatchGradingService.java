package com.igcse.ai.service.grading;

import com.igcse.ai.dto.BatchGradingResponse;
import com.igcse.ai.dto.BatchGradingResponse.BatchItemResult;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service xử lý batch grading (chấm nhiều bài cùng lúc)
 */
@Service
public class BatchGradingService {

    @Autowired
    private AIService aiService;

    // Lưu trữ trạng thái batch
    private final Map<String, BatchGradingResponse> batchResults = new ConcurrentHashMap<>();

    /**
     * Tạo batch mới và bắt đầu xử lý
     */
    public String createBatch(List<Long> attemptIds, String language) {
        String batchId = UUID.randomUUID().toString();

        BatchGradingResponse response = new BatchGradingResponse(batchId, attemptIds.size(), language);
        response.setStatus("PROCESSING");
        batchResults.put(batchId, response);

        // Start async processing
        processBatchAsync(batchId, attemptIds, language);

        return batchId;
    }

    /**
     * Xử lý batch bất đồng bộ
     */
    @Async("taskExecutor")
    public CompletableFuture<BatchGradingResponse> processBatchAsync(
            String batchId,
            List<Long> attemptIds,
            String language) {

        BatchGradingResponse response = batchResults.get(batchId);
        if (response == null) {
            return CompletableFuture.completedFuture(null);
        }

        response.setStatus("PROCESSING");

        // Xử lý từng attempt
        for (Long attemptId : attemptIds) {
            try {
                // Gọi AI Service để chấm điểm
                double score = aiService.evaluateExam(attemptId, language);

                // Lấy kết quả chi tiết
                AIResult result = aiService.getResult(attemptId);

                // Thêm vào batch response
                BatchItemResult itemResult = BatchItemResult.success(
                        attemptId,
                        score,
                        result.getConfidence(),
                        result.isPassed());
                response.addResult(itemResult);

            } catch (Exception e) {
                // Ghi nhận lỗi cho attempt này
                BatchItemResult itemResult = BatchItemResult.failed(attemptId, e.getMessage());
                response.addResult(itemResult);
            }
        }

        // Hoàn tất batch
        response.setStatus("COMPLETED");
        response.setCompletedAt(new Date());
        batchResults.put(batchId, response);

        return CompletableFuture.completedFuture(response);
    }

    /**
     * Lấy trạng thái batch
     */
    public BatchGradingResponse getBatchStatus(String batchId) {
        return batchResults.get(batchId);
    }

    /**
     * Xóa batch khỏi bộ nhớ
     */
    public void removeBatch(String batchId) {
        batchResults.remove(batchId);
    }

    /**
     * Lấy số lượng batch đang xử lý
     */
    public int getActiveBatchCount() {
        return (int) batchResults.values().stream()
                .filter(b -> "PROCESSING".equals(b.getStatus()))
                .count();
    }

    /**
     * Kiểm tra batch có tồn tại không
     */
    public boolean batchExists(String batchId) {
        return batchResults.containsKey(batchId);
    }
}
