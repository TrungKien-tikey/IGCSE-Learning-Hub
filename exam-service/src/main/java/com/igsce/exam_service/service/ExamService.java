package com.igsce.exam_service.service;

import java.util.*;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.igcse.ai.dto.aiChamDiem.AnswerDTO;
import com.igcse.ai.dto.aiChamDiem.EssayAnswer;

import com.igsce.exam_service.repository.*;
import com.igsce.exam_service.entity.*;
import com.igsce.exam_service.enums.QuestionType;
import com.igsce.exam_service.dto.*;
import com.igsce.exam_service.client.AIServiceClient;

@Service
public class ExamService {

    private final ExamRepository examRepository;
    private final ExamAttemptRepository attemptRepository;
    private final QuestionRepository questionRepository;
    private final AIServiceClient aiServiceClient;

    public ExamService(ExamRepository examRepository,
                       ExamAttemptRepository attemptRepository,
                       QuestionRepository questionRepository,
                       AIServiceClient aiServiceClient) {
        this.examRepository = examRepository;
        this.attemptRepository = attemptRepository;
        this.questionRepository = questionRepository;
        this.aiServiceClient = aiServiceClient;
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

        // Kiểm tra xem đã nộp chưa (tránh spam)
        if (attempt.getSubmittedAt() != null) {
             // throw new RuntimeException("Bài đã nộp rồi"); // Hoặc return false tùy logic
        }
        attempt.setSubmittedAt(LocalDateTime.now());

        double totalScore = 0;
        List<Answer> answersToSave = new ArrayList<>();
        
        // Danh sách chứa các câu tự luận cần AI chấm
        List<AnswerDTO> essayAnswersToGrade = new ArrayList<>();

        for (StudentAnswerDTO dto : userAnswers) {
            Question question = questionRepository.findById(dto.getQuestionId()).orElse(null);
            if (question == null) continue;

            Answer answer = new Answer();
            answer.setAttempt(attempt);
            answer.setQuestion(question);
            
            double score = 0;

            // --- LOGIC CHẤM ĐIỂM ---
            if (question.getQuestionType() == QuestionType.MCQ) {
                // 1. Xử lý Trắc nghiệm (Chấm ngay lập tức)
                answer.setSelectedOptionId(dto.getSelectedOptionId());
                
                QuestionOption correctOption = question.getOptions().stream()
                    .filter(QuestionOption::isCorrect)
                    .findFirst().orElse(null);

                boolean isCorrect = correctOption != null && correctOption.getOptionId().equals(dto.getSelectedOptionId());
                
                if (isCorrect) {
                    score = question.getScore();
                    answer.setFeedback("Chính xác");
                } else {
                    answer.setFeedback("Sai");
                }
                
                totalScore += score;
                answer.setScore(score);

            } else {
                // 2. Xử lý Tự luận (Gửi cho AI)
                answer.setTextAnswer(dto.getTextAnswer());
                answer.setScore(0.0); // Tạm thời 0
                answer.setFeedback("Đang chấm điểm..."); // Đánh dấu để Frontend biết

                // Chuẩn bị EssayAnswer DTO để gửi sang AI Service
                EssayAnswer essayAnswer = new EssayAnswer();
                essayAnswer.setQuestionId(question.getQuestionId());
                essayAnswer.setStudentAnswer(dto.getTextAnswer() != null ? dto.getTextAnswer() : "");
                essayAnswer.setQuestionText(question.getContent() != null ? question.getContent() : "");
                essayAnswer.setMaxScore(question.getScore());
                // Lấy đáp án tham khảo từ Question entity, nếu không có thì dùng default
                String referenceAnswer = question.getEssayCorrectAnswer();
                if (referenceAnswer == null || referenceAnswer.trim().isEmpty()) {
                    referenceAnswer = "Chấm điểm dựa trên độ chính xác, đầy đủ ý và diễn đạt mạch lạc.";
                }
                essayAnswer.setReferenceAnswer(referenceAnswer);
                
                essayAnswersToGrade.add(essayAnswer);
            }

            answersToSave.add(answer);
        }

        attempt.setAnswers(answersToSave);
        attempt.setTotalScore(totalScore); // Điểm này mới chỉ gồm trắc nghiệm
        
        // Lưu lần 1
        ExamAttempt savedAttempt = attemptRepository.save(attempt);

        // [ASYNC] Gọi AI chấm điểm chạy ngầm
        if (!essayAnswersToGrade.isEmpty()) {
            gradeEssaysAsync(savedAttempt.getAttemptId(), essayAnswersToGrade);
        }

        return true;
    }

    @Async("taskExecutor") 
    public void gradeEssaysAsync(Long attemptId, List<AnswerDTO> essays) {
        try {
            // Gọi AI Service qua HTTP REST API (Chạy mất vài giây -> vài chục giây)
            // Giả sử ngôn ngữ chấm là tiếng Việt ("vi")
            boolean success = aiServiceClient.markExam(attemptId, "vi");
            
            if (!success) {
                System.err.println("Lỗi gọi AI service để chấm điểm cho attemptId: " + attemptId);
            }
            // AI service sẽ gọi callback về /api/exams/grading-result khi xong
            
        } catch (Exception e) {
            System.err.println("Lỗi chấm điểm AI: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Nhận callback từ AI service và cập nhật điểm vào DB
     */
    @Transactional
    public boolean updateGradingResultFromAI(GradingResultCallbackDTO callback) {
        ExamAttempt attempt = attemptRepository.findById(callback.getAttemptId()).orElse(null);
        if (attempt == null) {
            System.err.println("Không tìm thấy attempt với ID: " + callback.getAttemptId());
            return false;
        }

        double additionalScore = 0;

        // Duyệt qua kết quả AI trả về
        if (callback.getAnswerScores() != null) {
            for (Map<String, Object> answerScore : callback.getAnswerScores()) {
                Long questionId = ((Number) answerScore.get("questionId")).longValue();
                Double score = ((Number) answerScore.get("score")).doubleValue();
                String feedback = (String) answerScore.get("feedback");

                // Tìm câu trả lời tương ứng trong DB (dựa vào QuestionID)
                for (Answer ans : attempt.getAnswers()) {
                    if (ans.getQuestion().getQuestionId().equals(questionId)) {
                        ans.setScore(score);
                        ans.setFeedback(feedback != null ? feedback : "Đã chấm");
                        additionalScore += score;
                        break;
                    }
                }
            }
        }

        // Cộng thêm điểm tự luận vào tổng điểm
        attempt.setTotalScore(attempt.getTotalScore() + additionalScore);
        
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
