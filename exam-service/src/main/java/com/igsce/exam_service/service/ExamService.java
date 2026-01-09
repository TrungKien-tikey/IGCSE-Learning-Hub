package com.igsce.exam_service.service;

import java.util.*;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional(readOnly = true)
    public List<Exam> getAllExams() {
        try {
            List<Exam> exams = examRepository.findAll();
            // Force load questions to avoid lazy loading exception
            exams.forEach(exam -> {
                if (exam.getQuestions() != null) {
                    exam.getQuestions().size(); // Trigger lazy loading
                }
            });
            return exams;
        } catch (Exception e) {
            System.err.println("Error in getAllExams: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public Exam getExamById(Long examId) {
        return examRepository.findById(examId)
                .orElseThrow();
    }

    @Transactional(readOnly = true)
    public ExamAttempt getExamAttempt(Long attemptId) {
        System.out.println(">>> [ExamService] API GET /attempt/" + attemptId + " called.");
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        // Force initialize answers to ensure they are available for AI Service
        // This prevents "No answers found" error due to Lazy Loading
        if (attempt.getAnswers() != null) {
            System.out.println(
                    ">>> [ExamService] Found " + attempt.getAnswers().size() + " answers for attempt " + attemptId);
            attempt.getAnswers().size(); // Trigger fetch
            attempt.getAnswers().forEach(a -> {
                if (a.getQuestion() != null) {
                    a.getQuestion().getQuestionType(); // Ensure question is loaded
                    a.getQuestion().getEssayCorrectAnswer(); // Force load reference answer
                }
            });
        } else {
            System.out.println(">>> [ExamService] Found 0 answers (null list) for attempt " + attemptId);
        }
        return attempt;
    }

    @Async("taskExecutor")
    public void gradeEssaysAsync(Long attemptId) {
        System.out.println(">>> [ExamService] Starting async grading for attemptId: " + attemptId);
        try {
            // Gọi AI Service qua HTTP REST API (Chạy mất vài giây -> vài chục giây)
            // Giả sử ngôn ngữ chấm là tiếng Việt ("vi")
            System.out.println(">>> [ExamService] Calling AI Service at " + aiServiceClient.getAiServiceUrl() + "...");
            boolean success = aiServiceClient.markExam(attemptId, "vi");
            System.out.println(">>> [ExamService] AI Service call result: " + success);

            if (!success) {
                System.err.println(">>> [ExamService] Failed to call AI service for attemptId: " + attemptId);
            }
        } catch (Exception e) {
            System.err.println(">>> [ExamService] Exception calling AI service: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Transactional
    public Exam createExam(CreateExamRequest request) {
        // #region agent log
        try {
            java.io.File logFile = new java.io.File("d:\\oop\\IGCSE-Learning-Hub\\.cursor\\debug.log");
            logFile.getParentFile().mkdirs();
            java.io.FileWriter fw = new java.io.FileWriter(logFile, true);
            fw.write(String.format(
                    "{\"timestamp\":%d,\"location\":\"ExamService.java:68\",\"message\":\"createExam service entry\",\"data\":{\"requestNotNull\":%s},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"B\"}\n",
                    System.currentTimeMillis(), request != null ? "true" : "false"));
            fw.close();
        } catch (Exception logEx) {
            System.err.println("Log write error: " + logEx.getMessage());
        }
        // #endregion
        try {
            if (request == null) {
                throw new IllegalArgumentException("CreateExamRequest cannot be null");
            }

            System.out.println("Creating exam with title: " + request.getTitle());

            Exam exam = new Exam();
            exam.setTitle(request.getTitle());
            exam.setDescription(request.getDescription());
            exam.setDuration(request.getDuration());
            exam.setActive(request.isActive());
            exam.setEndTime(request.getEndTime());
            exam.setMaxAttempts(request.getMaxAttempts() < 1 ? 1 : request.getMaxAttempts());

            List<Question> questions = new ArrayList<>();

            if (request.getQuestions() != null) {
                System.out.println("Processing " + request.getQuestions().size() + " questions");
                // #region agent log
                try {
                    java.io.File logFile = new java.io.File("d:\\oop\\IGCSE-Learning-Hub\\.cursor\\debug.log");
                    java.io.FileWriter fw = new java.io.FileWriter(logFile, true);
                    fw.write(String.format(
                            "{\"timestamp\":%d,\"location\":\"ExamService.java:91\",\"message\":\"before processing questions\",\"data\":{\"questionsCount\":%d},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"C\"}\n",
                            System.currentTimeMillis(), request.getQuestions().size()));
                    fw.close();
                } catch (Exception logEx) {
                    System.err.println("Log write error: " + logEx.getMessage());
                }
                // #endregion

                // [FIX 1] Tạo biến đếm bắt đầu từ 0 để tự động đánh số
                int currentIndex = 0;

                // [FIX 2] Gọi đúng tên Class con: CreateExamRequest.QuestionRequest
                for (QuestionRequest qRequest : request.getQuestions()) {
                    try {
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

                        // Lưu đáp án tham khảo cho câu ESSAY
                        if (qRequest.getQuestionType() == QuestionType.ESSAY) {
                            question.setEssayCorrectAnswer(qRequest.getEssayCorrectAnswer());
                        }

                        // Note: essayCorrectAnswer không có trong QuestionRequest DTO
                        // Có thể thêm vào DTO sau nếu cần

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
                    } catch (Exception e) {
                        System.err.println("Error processing question: " + e.getMessage());
                        e.printStackTrace();
                        throw new RuntimeException("Error processing question: " + e.getMessage(), e);
                    }
                }
            }

            exam.setQuestions(questions);
            // #region agent log
            try {
                java.io.File logFile = new java.io.File("d:\\oop\\IGCSE-Learning-Hub\\.cursor\\debug.log");
                java.io.FileWriter fw = new java.io.FileWriter(logFile, true);
                fw.write(String.format(
                        "{\"timestamp\":%d,\"location\":\"ExamService.java:160\",\"message\":\"before save\",\"data\":{\"questionsCount\":%d},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"D\"}\n",
                        System.currentTimeMillis(), questions.size()));
                fw.close();
            } catch (Exception logEx) {
                System.err.println("Log write error: " + logEx.getMessage());
            }
            // #endregion

            System.out.println("Saving exam to database...");
            Exam savedExam = examRepository.save(exam);
            // #region agent log
            try {
                java.io.File logFile = new java.io.File("d:\\oop\\IGCSE-Learning-Hub\\.cursor\\debug.log");
                java.io.FileWriter fw = new java.io.FileWriter(logFile, true);
                fw.write(String.format(
                        "{\"timestamp\":%d,\"location\":\"ExamService.java:181\",\"message\":\"after save\",\"data\":{\"examId\":%d},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"D\"}\n",
                        System.currentTimeMillis(), savedExam != null ? savedExam.getExamId() : -1));
                fw.close();
            } catch (Exception logEx) {
                System.err.println("Log write error: " + logEx.getMessage());
            }
            // #endregion
            System.out.println("Exam saved successfully with ID: " + savedExam.getExamId());

            return savedExam;
        } catch (Exception e) {
            // #region agent log
            try {
                java.io.File logFile = new java.io.File("d:\\oop\\IGCSE-Learning-Hub\\.cursor\\debug.log");
                java.io.FileWriter fw = new java.io.FileWriter(logFile, true);
                String errorMsg = e.getMessage() != null ? e.getMessage().replace("\"", "'").replace("\n", " ")
                        .substring(0, Math.min(200, e.getMessage().length())) : "null";
                fw.write(String.format(
                        "{\"timestamp\":%d,\"location\":\"ExamService.java:196\",\"message\":\"createExam service error\",\"data\":{\"error\":\"%s\",\"class\":\"%s\"},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"E\"}\n",
                        System.currentTimeMillis(), errorMsg, e.getClass().getName()));
                fw.close();
            } catch (Exception logEx) {
                System.err.println("Log write error: " + logEx.getMessage());
            }
            // #endregion
            System.err.println("Error in createExam: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create exam: " + e.getMessage(), e);
        }
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
            throw new RuntimeException(
                    "Bạn đã hết lượt làm bài! (" + currentAttempts + " / " + exam.getMaxAttempts() + " lần)");
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

        // Đánh dấu có câu essay cần AI chấm
        boolean hasEssayQuestions = false;

        for (StudentAnswerDTO dto : userAnswers) {
            Question question = questionRepository.findById(dto.getQuestionId()).orElse(null);
            if (question == null)
                continue;

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

                boolean isCorrect = correctOption != null
                        && correctOption.getOptionId().equals(dto.getSelectedOptionId());

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

                // Đánh dấu có câu essay để gọi AI chấm
                hasEssayQuestions = true;
            }

            answersToSave.add(answer);
        }

        attempt.setAnswers(answersToSave);
        attempt.setTotalScore(totalScore); // Điểm này mới chỉ gồm trắc nghiệm

        // Lưu lần 1
        ExamAttempt savedAttempt = attemptRepository.save(attempt);

        // [ASYNC] Gọi AI chấm điểm chạy ngầm - Chỉ gọi sau khi Transaction COMMIT thành
        // công
        if (hasEssayQuestions) {
            final Long finalAttemptId = savedAttempt.getAttemptId();
            if (org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive()) {
                org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                        new org.springframework.transaction.support.TransactionSynchronization() {
                            @Override
                            public void afterCommit() {
                                gradeEssaysAsync(finalAttemptId);
                            }
                        });
            } else {
                gradeEssaysAsync(finalAttemptId);
            }
        }

        return true;
    }

    /**
     * Nhận callback từ AI service và cập nhật điểm vào DB
     */
    @Transactional
    public boolean updateGradingResultFromAI(GradingResultCallbackDTO callback) {
        System.out.println(">>> [ExamService] Received callback for attemptId: " + callback.getAttemptId());

        ExamAttempt attempt = attemptRepository.findById(callback.getAttemptId()).orElse(null);
        if (attempt == null) {
            System.err.println(">>> [ExamService] Error: Attempt not found with ID: " + callback.getAttemptId());
            return false;
        }

        // Force init
        if (attempt.getAnswers() != null)
            attempt.getAnswers().size();

        double additionalScore = 0;
        int updatedCount = 0;

        // Duyệt qua kết quả AI trả về
        if (callback.getAnswerScores() != null) {
            System.out.println(">>> [ExamService] Processing " + callback.getAnswerScores().size() + " scores from AI");
            for (Map<String, Object> answerScore : callback.getAnswerScores()) {
                Long questionId = ((Number) answerScore.get("questionId")).longValue();
                Double score = ((Number) answerScore.get("score")).doubleValue();
                String feedback = (String) answerScore.get("feedback");

                // Tìm câu trả lời tương ứng trong DB (dựa vào QuestionID)
                for (Answer ans : attempt.getAnswers()) {
                    // Kiểm tra null safety cho question
                    if (ans.getQuestion() != null && ans.getQuestion().getQuestionId().equals(questionId)) {
                        System.out
                                .println(">>> [ExamService] Updating score for question " + questionId + ": " + score);
                        ans.setScore(score);
                        ans.setFeedback(feedback != null ? feedback : "Đã chấm");
                        additionalScore += score;
                        updatedCount++;
                        break;
                    }
                }
            }
        } else {
            System.out.println(">>> [ExamService] Warning: AnswerScores list is null");
        }

        System.out.println(
                ">>> [ExamService] Updated " + updatedCount + " answers. Additional Score: " + additionalScore);

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

                // Lưu đáp án tham khảo cho câu ESSAY
                if (qRequest.getQuestionType() == QuestionType.ESSAY) {
                    question.setEssayCorrectAnswer(qRequest.getEssayCorrectAnswer());
                }

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
