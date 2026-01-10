package com.igsce.exam_service.listener;

import com.igsce.exam_service.dto.GradingResultCallbackDTO;
import com.igsce.exam_service.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GradingResultListener {

    private final ExamService examService;

    @RabbitListener(queues = "exam.grading.result.queue")
    public void receiveGradingResult(GradingResultCallbackDTO resultDTO) {
        System.out.println(
                ">>> [RabbitMQ - ExamService] Received grading result for attemptId: " + resultDTO.getAttemptId());
        try {
            boolean success = examService.updateGradingResultFromAI(resultDTO);
            if (success) {
                System.out.println(">>> [RabbitMQ - ExamService] Successfully updated grading result for attemptId: "
                        + resultDTO.getAttemptId());
            } else {
                System.err.println(">>> [RabbitMQ - ExamService] Failed to update grading result for attemptId: "
                        + resultDTO.getAttemptId());
            }
        } catch (Exception e) {
            System.err.println(">>> [RabbitMQ - ExamService] Error processing grading result: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
