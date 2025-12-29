package com.igcse.ai.service.aiChamDiem;

import com.igcse.ai.dto.xuLyBatch.BatchGradingResponse;
import com.igcse.ai.dto.xuLyBatch.BatchGradingResponse.BatchItemResult;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.service.AIService;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Qualifier;

/**
 * Service xử lý batch grading (chấm nhiều bài cùng lúc)
 */
@Service
public class BatchGradingService {

    private final AIService aiService;
    @Qualifier("taskExecutor")
    private final Executor taskExecutor;

    public BatchGradingService(AIService aiService, @Qualifier("taskExecutor") Executor taskExecutor) {
        this.aiService = aiService;
        this.taskExecutor = taskExecutor;
    }

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

        // Tạo các task xử lý song song cho từng attempt
        List<CompletableFuture<Void>> futures = attemptIds.stream()
                .map(attemptId -> CompletableFuture.runAsync(() -> {
                    try {
                        // Gọi AI Service để chấm điểm
                        double score = aiService.evaluateExam(attemptId, language);

                        // Lấy kết quả chi tiết
                        AIResult result = aiService.getResult(attemptId);

                        // Thêm vào batch response (đã được synchronized)
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
                }, taskExecutor))
                .collect(Collectors.toList());

        // Đợi tất cả hoàn thành và cập nhật trạng thái chung
        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
                .thenApply(v -> {
                    // Hoàn tất batch
                    response.setStatus("COMPLETED");
                    response.setCompletedAt(new Date());
                    batchResults.put(batchId, response);
                    return response;
                });
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
