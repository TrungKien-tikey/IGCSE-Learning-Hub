package com.igsce.exam_service.service;

import lombok.*;
import java.util.*;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.igsce.exam_service.repository.*;
import com.igsce.exam_service.entity.*;
import com.igsce.exam_service.enums.QuestionType;
import com.igsce.exam_service.dto.*;

@Service
public class ExamService {

    private final ExamRepository examRepository;
    private final ExamAttemptRepository attemptRepository;
    private final QuestionRepository questionRepository;

    public ExamService(ExamRepository examRepository,
                       ExamAttemptRepository attemptRepository,
                       QuestionRepository questionRepository) {
        this.examRepository = examRepository;
        this.attemptRepository = attemptRepository;
        this.questionRepository = questionRepository;
    }

    public List<Exam> getAllExams() {
        return examRepository.findAll();
    }

    public Exam getExamById(Long examId) {
        return examRepository.findById(examId)
                .orElseThrow();
    }

    public ExamAttempt getExamAttempt(Long attemptId) {
        return attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));
    }

    @Transactional
    public Exam createExam(CreateExamRequest request) {
        Exam exam = new Exam();
        exam.setTitle(request.getTitle());
        exam.setDescription(request.getDescription());
        exam.setDuration(request.getDuration());
        exam.setActive(request.isActive());
        exam.setEndTime(request.getEndTime());
        exam.setMaxAttempts(request.getMaxAttempts() < 1 ? 1 : request.getMaxAttempts());

        List<Question> questions = new ArrayList<>();

        if (request.getQuestions() != null) {
            
            // [FIX 1] Tạo biến đếm bắt đầu từ 0 để tự động đánh số
            int currentIndex = 0; 

            // [FIX 2] Gọi đúng tên Class con: CreateExamRequest.QuestionRequest
            for (QuestionRequest qRequest : request.getQuestions()) {
                Question question = new Question();
                question.setContent(qRequest.getContent());
                question.setScore(qRequest.getScore());
                question.setQuestionType(qRequest.getQuestionType());
                
                // [FIX 3] LOGIC CHỐNG LỖI NULL
                // Nếu Frontend có gửi thứ tự -> dùng của Frontend
                // Nếu Frontend gửi null -> dùng biến đếm currentIndex của Java
                if (qRequest.getOrderIndex() != null) {
                    question.setOrderIndex(qRequest.getOrderIndex());
                } else {
                    question.setOrderIndex(currentIndex);
                }
                currentIndex++; // Tăng số thứ tự cho câu sau

                // Lưu ảnh Base64
                question.setImage(qRequest.getImage());

                // Thiết lập quan hệ cha-con
                question.setExam(exam);

                // Xử lý Options
                if (qRequest.getOptions() != null && !qRequest.getOptions().isEmpty()) {
                    List<QuestionOption> options = new ArrayList<>();
                    
                    // [FIX 4] Gọi đúng tên Class con: CreateExamRequest.OptionRequest
                    for (OptionRequest oRequest : qRequest.getOptions()) {
                        QuestionOption option = new QuestionOption();
                        option.setContent(oRequest.getContent());
                        option.setCorrect(oRequest.isCorrect());
                        
                        // Thiết lập quan hệ ngược lại
                        option.setQuestion(question);
                        
                        options.add(option);
                    }
                    question.setOptions(options);
                }

                questions.add(question);
            }
        }

        exam.setQuestions(questions);

        return examRepository.save(exam);
    }

    public void deleteExam(Long id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài thi với ID: " + id));
        
        exam.setActive(false);
        examRepository.save(exam);
    }

    public ExamAttempt startExam(Long examId, Long userId) {

        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        if (!exam.isActive()) {
            throw new RuntimeException("Exam is not active");
        }

        if (exam.getEndTime() != null && LocalDateTime.now().isAfter(exam.getEndTime())) {
            throw new RuntimeException("Bài thi đã hết hạn vào lúc: " + exam.getEndTime());
        }

        int currentAttempts = attemptRepository.countByExam_ExamIdAndUserId(examId, userId);
        if (currentAttempts >= exam.getMaxAttempts()) {
            throw new RuntimeException("Bạn đã hết lượt làm bài! (" + currentAttempts + " / " + exam.getMaxAttempts() + " lần)");
        }

        ExamAttempt attempt = new ExamAttempt();
        attempt.setExam(exam);
        attempt.setUserId(userId);
        attempt.setStartTime(LocalDateTime.now());
        attempt.setTotalScore(0);

        return attemptRepository.save(attempt);
    }

    @Transactional
    public boolean submitExam(Long attemptId, List<StudentAnswerDTO> userAnswers) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Not found"));

        double totalScore = 0;
        List<Answer> answersToSave = new ArrayList<>();

        for (StudentAnswerDTO dto : userAnswers) {
            Question question = questionRepository.findById(dto.getQuestionId()).orElse(null);
            if (question == null) continue;

            Answer answer = new Answer();
            answer.setAttempt(attempt);
            answer.setQuestion(question);
            
            double score = 0;

            // --- LOGIC CHẤM ĐIỂM ---
            if (question.getQuestionType() == QuestionType.MCQ) {
                // 1. Xử lý Trắc nghiệm
                answer.setSelectedOptionId(dto.getSelectedOptionId());
                
                // Tìm option đúng trong database
                QuestionOption correctOption = question.getOptions().stream()
                    .filter(QuestionOption::isCorrect)
                    .findFirst().orElse(null);

                // So sánh ID option sinh viên chọn với ID option đúng
                if (correctOption != null && correctOption.getOptionId().equals(dto.getSelectedOptionId())) {
                    score = question.getScore();
                }
            } else {
                // 2. Xử lý Tự luận
                answer.setTextAnswer(dto.getTextAnswer());
                // Tự luận thường không chấm tự động được ngay -> score = 0 hoặc chờ giáo viên chấm
                score = 0; 
            }

            answer.setScore(score);
            totalScore += score;
            answersToSave.add(answer);
        }

        attempt.setAnswers(answersToSave);
        attempt.setTotalScore(totalScore);
        attemptRepository.save(attempt);
        return true;
    }

    @Transactional
    public Exam updateExam(Long examId, CreateExamRequest request) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        // 1. Cập nhật thông tin chung
        exam.setTitle(request.getTitle());
        exam.setDescription(request.getDescription());
        exam.setDuration(request.getDuration());
        exam.setActive(request.isActive());
        exam.setEndTime(request.getEndTime());
        exam.setMaxAttempts(request.getMaxAttempts() < 1 ? 1 : request.getMaxAttempts());

        // 2. Xử lý câu hỏi:
        // Cách đơn giản nhất: Xóa danh sách cũ, thay bằng danh sách mới
        // Lưu ý: Hibernate sẽ tự động xóa orphan (câu hỏi cũ) nếu config Cascade đúng
        exam.getQuestions().clear(); 

        if (request.getQuestions() != null) {
            int currentIndex = 0;
            for (QuestionRequest qRequest : request.getQuestions()) {
                Question question = new Question();
                question.setContent(qRequest.getContent());
                question.setScore(qRequest.getScore());
                question.setQuestionType(qRequest.getQuestionType());
                question.setOrderIndex(qRequest.getOrderIndex() != null ? qRequest.getOrderIndex() : currentIndex++);
                question.setImage(qRequest.getImage());
                
                // Quan trọng: Gán lại Exam cha
                question.setExam(exam);

                // Xử lý Options
                if (qRequest.getOptions() != null) {
                    List<QuestionOption> options = new ArrayList<>();
                    for (OptionRequest oRequest : qRequest.getOptions()) {
                        QuestionOption option = new QuestionOption();
                        option.setContent(oRequest.getContent());
                        option.setCorrect(oRequest.isCorrect());
                        option.setQuestion(question);
                        options.add(option);
                    }
                    question.setOptions(options);
                }
                exam.getQuestions().add(question);
            }
        }

        return examRepository.save(exam);
    }

}
