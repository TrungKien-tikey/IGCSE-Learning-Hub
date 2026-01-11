package com.igcse.ai.listener;

import com.igcse.ai.dto.aiChamDiem.ExamAnswersDTO;
import com.igcse.ai.dto.aiChamDiem.DetailedGradingResultDTO;
import com.igcse.ai.service.AIService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GradingMessageListener {

    private static final Logger logger = LoggerFactory.getLogger(GradingMessageListener.class);
    private final AIService aiService;
    private final org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @RabbitListener(queues = "exam.grading.queue")
    public void receiveGradingRequest(ExamAnswersDTO examAnswersDTO) {
        logger.info(">>> [RabbitMQ] Received grading request for attemptId: {}", examAnswersDTO.getAttemptId());
        try {
            // [REFACTOR] Gọi method chấm và lấy kết quả trả về
            DetailedGradingResultDTO result = aiService
                    .evaluateExamGetResult(examAnswersDTO);

            if (result != null) {
                // Tạo message kết quả để gửi lại cho Exam Service (Response Queue)
                logger.info(">>> [RabbitMQ] Grading passed. Sending result to result queue: {}",
                        com.igcse.ai.config.RabbitConfig.RESULT_QUEUE_NAME);

                rabbitTemplate.convertAndSend(
                        com.igcse.ai.config.RabbitConfig.RESULT_EXCHANGE_NAME,
                        com.igcse.ai.config.RabbitConfig.RESULT_ROUTING_KEY,
                        result);
            } else {
                logger.warn(">>> [RabbitMQ] Grading returned null result for attemptId: {}",
                        examAnswersDTO.getAttemptId());
            }

        } catch (Exception e) {
            logger.error(">>> [RabbitMQ] Error processing grading request: {}", e.getMessage(), e);
            // Có thể throw để RabbitMQ retry hoặc đẩy vào Dead Letter Queue
        }
    }
}
