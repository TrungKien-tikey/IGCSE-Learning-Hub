package com.igsce.exam_service.controller;

import com.igsce.exam_service.entity.*;
import com.igsce.exam_service.service.*;
import com.igsce.exam_service.dto.*;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import lombok.*;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173",
        "http://127.0.0.1:5174" })
public class ExamController {

    private final ExamService examService;

    @GetMapping
    public ResponseEntity<List<Exam>> getExams() {
        try {
            List<Exam> exams = examService.getAllExams();
            exams.forEach(e -> System.out.println("Exam Title: " + e.getTitle()));
            return ResponseEntity.ok(exams);
        } catch (Exception e) {
            System.err.println("Error getting exams: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
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

    @PostMapping
    public ResponseEntity<?> createExam(
            @RequestBody CreateExamRequest request) {
        // #region agent log
        try {
            java.io.File logFile = new java.io.File("d:\\oop\\IGCSE-Learning-Hub\\.cursor\\debug.log");
            logFile.getParentFile().mkdirs();
            java.io.FileWriter fw = new java.io.FileWriter(logFile, true);
            fw.write(String.format(
                    "{\"timestamp\":%d,\"location\":\"ExamController.java:52\",\"message\":\"createExam entry\",\"data\":{\"title\":\"%s\",\"questionsCount\":%d},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"A\"}\n",
                    System.currentTimeMillis(),
                    request != null && request.getTitle() != null ? request.getTitle().replace("\"", "'") : "null",
                    request != null && request.getQuestions() != null ? request.getQuestions().size() : 0));
            fw.close();
        } catch (Exception logEx) {
            System.err.println("Log write error: " + logEx.getMessage());
        }
        // #endregion
        try {
            System.out.println("Received create exam request: " + (request != null ? request.getTitle() : "null"));
            // #region agent log
            try {
                java.io.File logFile = new java.io.File("d:\\oop\\IGCSE-Learning-Hub\\.cursor\\debug.log");
                java.io.FileWriter fw = new java.io.FileWriter(logFile, true);
                fw.write(String.format(
                        "{\"timestamp\":%d,\"location\":\"ExamController.java:65\",\"message\":\"before calling service\",\"data\":{\"serviceNotNull\":%s},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"F\"}\n",
                        System.currentTimeMillis(), examService != null ? "true" : "false"));
                fw.close();
            } catch (Exception logEx) {
                System.err.println("Log write error: " + logEx.getMessage());
            }
            // #endregion
            Exam exam = examService.createExam(request);
            // #region agent log
            try {
                java.io.File logFile = new java.io.File("d:\\oop\\IGCSE-Learning-Hub\\.cursor\\debug.log");
                java.io.FileWriter fw = new java.io.FileWriter(logFile, true);
                fw.write(String.format(
                        "{\"timestamp\":%d,\"location\":\"ExamController.java:67\",\"message\":\"createExam success\",\"data\":{\"examId\":%d},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"A\"}\n",
                        System.currentTimeMillis(), exam != null ? exam.getExamId() : -1));
                fw.close();
            } catch (Exception logEx) {
                System.err.println("Log write error: " + logEx.getMessage());
            }
            // #endregion
            return ResponseEntity.ok(exam);
        } catch (Exception e) {
            // #region agent log
            try {
                java.io.File logFile = new java.io.File("d:\\oop\\IGCSE-Learning-Hub\\.cursor\\debug.log");
                java.io.FileWriter fw = new java.io.FileWriter(logFile, true);
                String errorMsg = e.getMessage() != null ? e.getMessage().replace("\"", "'").replace("\n", " ")
                        .substring(0, Math.min(200, e.getMessage().length())) : "null";
                fw.write(String.format(
                        "{\"timestamp\":%d,\"location\":\"ExamController.java:82\",\"message\":\"createExam error\",\"data\":{\"error\":\"%s\",\"class\":\"%s\"},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"A\"}\n",
                        System.currentTimeMillis(), errorMsg, e.getClass().getName()));
                fw.close();
            } catch (Exception logEx) {
                System.err.println("Log write error: " + logEx.getMessage());
            }
            // #endregion
            System.err.println("Error creating exam: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
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

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExam(@PathVariable Long id, @RequestBody CreateExamRequest request) {
        examService.updateExam(id, request);
        return ResponseEntity.ok("Cập nhật thành công");
    }

    @PostMapping("/grading-result")
    public ResponseEntity<GradingResultResponseDTO> updateGradingResult(@RequestBody GradingResultCallbackDTO request) {
        boolean success = examService.updateGradingResultFromAI(request);

        GradingResultResponseDTO response = success
                ? GradingResultResponseDTO.success(request.getAttemptId())
                : GradingResultResponseDTO.failure(request.getAttemptId(), "Không tìm thấy attempt hoặc lỗi cập nhật");

        return ResponseEntity.ok(response);
    }

}
