package com.igsce.exam_service.controller;

import com.igsce.exam_service.entity.*;
import com.igsce.exam_service.service.*;
import com.igsce.exam_service.dto.*;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import lombok.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class ExamController {
    private static final Logger logger = LoggerFactory.getLogger(ExamController.class);

    private final ExamService examService;

    @GetMapping
    public List<Exam> getExams() {
        return examService.getAllExams();
    }

    @GetMapping("/{examId}")
    public Exam getExam(@PathVariable Long examId) {
        return examService.getExamById(examId);
    }

    @GetMapping("/attempt/{attemptId}")
    public ResponseEntity<?> getExamAttempt(@PathVariable Long attemptId) {
        try {
            ExamAttempt attempt = examService.getExamAttempt(attemptId);
            return ResponseEntity.ok(attempt);
        } catch (IllegalArgumentException e) {
            // Attempt not found - return 404
            logger.warn("Attempt not found: {}", attemptId);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("message", "Exam attempt not found");
            return ResponseEntity.status(404).body(error);
        } catch (Exception e) {
            // Other errors - return 500
            logger.error("Error getting exam attempt: {}", attemptId, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("message", "Failed to get exam attempt");
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Lấy kết quả chấm điểm từ AI Service
     * Lấy dữ liệu từ ai_db.ai_results thông qua AI Service API
     * 
     * @param attemptId ID của lượt làm bài
     * @return Kết quả chấm điểm từ AI (score, feedback, confidence, etc.)
     */
    @GetMapping("/attempt/{attemptId}/ai-result")
    public ResponseEntity<?> getAIGradingResult(@PathVariable Long attemptId) {
        try {
            com.igsce.exam_service.dto.AIGradingResultDTO result = 
                examService.getAIGradingResult(attemptId);
            
            if (result == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("message", "AI grading result not found. The exam may not have been graded yet.");
                response.put("attemptId", attemptId);
                return ResponseEntity.status(404).body(response);
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error getting AI grading result for attemptId: {}", attemptId, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("message", "Failed to get AI grading result");
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Lấy kết quả chấm điểm chi tiết từ AI Service
     * Bao gồm feedback cho từng câu hỏi
     * 
     * @param attemptId ID của lượt làm bài
     * @return Kết quả chi tiết với feedback từng câu
     */
    @GetMapping("/attempt/{attemptId}/ai-result/details")
    public ResponseEntity<?> getDetailedAIGradingResult(@PathVariable Long attemptId) {
        try {
            Map<String, Object> result = examService.getDetailedAIGradingResult(attemptId);
            
            if (result == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Detailed AI grading result not found. The exam may not have been graded yet.");
                response.put("attemptId", attemptId);
                return ResponseEntity.status(404).body(response);
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error getting detailed AI grading result for attemptId: {}", attemptId, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("message", "Failed to get detailed AI grading result");
            return ResponseEntity.status(500).body(error);
        }
    }

    @PostMapping
    public ResponseEntity<?> createExam(
            @RequestBody CreateExamRequest request) {
        try {
            Exam exam = examService.createExam(request);
            return ResponseEntity.ok(exam.getExamId());
        } catch (Exception e) {
            logger.error("Error creating exam", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("message", "Failed to create exam");
            return ResponseEntity.status(500).body(error);
        }
    }

    @PostMapping("/start")
    public ResponseEntity<ExamAttempt> startExam(
            @RequestBody StartExamRequest request) {

        return ResponseEntity.ok(
                examService.startExam(
                        request.getExamId(),
                        request.getUserId()));
    }

    @PostMapping("/submit")
    public ResponseEntity<Boolean> submitExam(
            @RequestBody SubmitExamRequest request) {

        return ResponseEntity.ok(
                examService.submitExam(
                        request.getAttemptId(),
                        request.getAnswers()));
    }

    @PostMapping("/grading-result")
    public ResponseEntity<Map<String, Object>> updateGradingResult(
            @RequestBody GradingResultDTO gradingResult) {
        
        boolean success = examService.updateGradingResult(gradingResult);
        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        response.put("attemptId", gradingResult.getAttemptId());
        
        return success 
            ? ResponseEntity.ok(response)
            : ResponseEntity.badRequest().body(response);
    }

}
