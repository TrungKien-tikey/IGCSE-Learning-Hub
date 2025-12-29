package com.igsce.exam_service.controller;

import com.igsce.exam_service.entity.*;
import com.igsce.exam_service.service.*;
import com.igsce.exam_service.dto.*;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ExamController {

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
    public ResponseEntity<ExamAttempt> getExamAttempt(@PathVariable Long attemptId) {
        return ResponseEntity.ok(examService.getExamAttempt(attemptId));
    }

    @PostMapping
    public ResponseEntity<?> createExam(
            @RequestBody CreateExamRequest request) {
        examService.createExam(request);
        return ResponseEntity.ok(true);
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

}
