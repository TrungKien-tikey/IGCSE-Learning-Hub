package com.igsce.exam_service.controller;

import com.igsce.exam_service.entity.*;
import com.igsce.exam_service.service.*;
import com.igsce.exam_service.util.SecurityUtils;
import com.igsce.exam_service.dto.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import lombok.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
// Vẫn giữ CrossOrigin để phòng hờ, nhưng Proxy đã giải quyết vấn đề này
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class ExamController {

    private final ExamService examService;

    @GetMapping
    public ResponseEntity<List<Exam>> getExams() {
        return ResponseEntity.ok(examService.getAllExams());
    }

    @GetMapping("/{examId}")
    public Exam getExam(@PathVariable Long examId) {
        return examService.getExamById(examId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExam(@PathVariable Long id) {
        examService.deleteExam(id);
        return ResponseEntity.ok("Xóa bài thi thành công");
    }

    @GetMapping("/attempt/{attemptId}")
    public ResponseEntity<ExamAttempt> getExamAttempt(@PathVariable Long attemptId) {
        return ResponseEntity.ok(examService.getExamAttempt(attemptId));
    }

    @GetMapping("/attempts/{examId}")
    public ResponseEntity<List<ExamAttempt>> getAttemptsByExamId(@PathVariable Long examId) {
        return ResponseEntity.ok(examService.getAttemptsByExamId(examId));
    }

    @PostMapping
    public ResponseEntity<?> createExam(@RequestBody CreateExamRequest request) {
        try {
            return ResponseEntity.ok(examService.createExam(request));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<ExamAttempt>> getHistory() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(examService.getAttemptsByUserId(userId));
    }

    @PostMapping("/start")
    public ResponseEntity<?> startExam(@RequestBody Map<String, Long> requestBody) {
        try {
            Long examId = requestBody.get("examId");
            Long userId = SecurityUtils.getCurrentUserId();
            ExamAttempt attempt = examService.startExam(examId, userId);
            return ResponseEntity.ok(Map.of("attemptId", attempt.getAttemptId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<Boolean> submitExam(@RequestBody SubmitExamRequest request) {
        return ResponseEntity.ok(examService.submitExam(request.getAttemptId(), request.getAnswers()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExam(@PathVariable Long id, @RequestBody CreateExamRequest request) {
        examService.updateExam(id, request);
        return ResponseEntity.ok("Cập nhật thành công");
    }

    @PostMapping("/grading-result")
    public ResponseEntity<GradingResultResponseDTO> updateGradingResult(@RequestBody GradingResultCallbackDTO request) {
        boolean success = examService.updateGradingResultFromAI(request);
        return ResponseEntity.ok(success
                ? GradingResultResponseDTO.success(request.getAttemptId())
                : GradingResultResponseDTO.failure(request.getAttemptId(), "Lỗi cập nhật điểm"));
    }
}