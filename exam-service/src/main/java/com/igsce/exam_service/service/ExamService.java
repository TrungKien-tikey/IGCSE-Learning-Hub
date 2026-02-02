package com.igsce.exam_service.service;

import java.util.*;
import java.time.LocalDateTime;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import com.igsce.exam_service.repository.*;
import com.igsce.exam_service.entity.*;
import com.igsce.exam_service.enums.GradingStatus;
import com.igsce.exam_service.enums.QuestionType;
import com.igsce.exam_service.dto.*;

@Service
public class ExamService {

    private final ExamRepository examRepository;
    private final ExamAttemptRepository attemptRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final RabbitTemplate rabbitTemplate;

    public ExamService(ExamRepository examRepository,
            ExamAttemptRepository attemptRepository,
            QuestionRepository questionRepository,
            AnswerRepository answerRepository,
            RabbitTemplate rabbitTemplate) {
        this.examRepository = examRepository;
        this.attemptRepository = attemptRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.rabbitTemplate = rabbitTemplate;
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

    public List<ExamAttempt> getAttemptsByUserId(Long userId) {
        return attemptRepository.findByUserId(userId);
    }

    public List<ExamAttempt> getAttemptsByStatus(GradingStatus status) {
        return attemptRepository.findByGradingStatus(status);
    }

    public void updateManualGrade(Long attemptId, Long answerId, Double newScore, String feedback) {
        // Tìm câu trả lời
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new RuntimeException("Answer not found"));

        // Lưu điểm giáo viên chấm (Override)
        answer.applyTeacherGrading(newScore, feedback);
        answerRepository.save(answer);

        // Tính lại tổng điểm toàn bài
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        attempt.recalculateTotalScore();

        // Nếu muốn, có thể đổi trạng thái bài thi thành COMPLETED luôn tại đây
        // hoặc chờ giáo viên nhấn nút "Hoàn tất" riêng.
        attempt.setGradingStatus(GradingStatus.COMPLETED);

        attemptRepository.save(attempt);
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

    @Transactional(readOnly = true)
    public List<ExamAttempt> getAttemptsByExamId(Long examId) {
        // Kiểm tra xem Exam có tồn tại không (tùy chọn)
        if (!examRepository.existsById(examId)) {
            throw new RuntimeException("Exam not found with id: " + examId);
        }

        // Gọi Repository lấy danh sách
        List<ExamAttempt> attempts = attemptRepository.findByExam_ExamIdOrderBySubmittedAtDesc(examId);

        // (Tùy chọn) Force load dữ liệu nếu cần thiết để tránh lỗi Lazy Loading khi
        // convert JSON
        // Nhưng thường với danh sách bảng điểm thì không cần load sâu User Answers

        return attempts;
    }

    @Async("taskExecutor")
    public void gradeEssaysAsync(Long attemptId) {
        System.out.println(">>> [ExamService] Starting async grading for attemptId: " + attemptId);
        try {
            // 1. Lấy dữ liệu bài làm từ DB
            ExamAttempt attempt = attemptRepository.findById(attemptId)
                    .orElseThrow(() -> new RuntimeException("Attempt not found: " + attemptId));

            // Force fetch questions/answers
            if (attempt.getAnswers() != null) {
                attempt.getAnswers().size();
                attempt.getAnswers().forEach(a -> {
                    if (a.getQuestion() != null) {
                        a.getQuestion().getQuestionType();
                        a.getQuestion().getEssayCorrectAnswer();
                    }
                });
            }

            // 2. Build ExamAnswersDTO để gửi đi
            ExamAnswersDTO dto = new ExamAnswersDTO();
            dto.setAttemptId(attemptId);
            dto.setStudentId(attempt.getUserId());
            dto.setExamId(attempt.getExam() != null ? attempt.getExam().getExamId() : null);
            dto.setLanguage("vi"); // Mặc định hoặc lấy từ user preference

            List<AnswerDTO> answerDTOs = new ArrayList<>();
            if (attempt.getAnswers() != null) {
                for (Answer ans : attempt.getAnswers()) {
                    Question q = ans.getQuestion();
                    if (q == null)
                        continue;

                    if (q.getQuestionType() == QuestionType.ESSAY) {
                        EssayAnswer essay = new EssayAnswer();
                        essay.setQuestionId(q.getQuestionId());
                        essay.setStudentAnswer(ans.getTextAnswer());
                        essay.setQuestionText(q.getContent());
                        essay.setReferenceAnswer(q.getEssayCorrectAnswer());
                        essay.setMaxScore(q.getScore());
                        answerDTOs.add(essay);
                    } else {
                        // Có thể thêm trắc nghiệm nếu muốn AI phân tích
                    }
                }
            }
            dto.setAnswers(answerDTOs);

            // 3. Gửi Message qua RabbitMQ
            System.out.println(">>> [ExamService] Sending grading request to RabbitMQ via exchange: "
                    + com.igsce.exam_service.config.RabbitConfig.EXCHANGE_NAME);
            rabbitTemplate.convertAndSend(
                    com.igsce.exam_service.config.RabbitConfig.EXCHANGE_NAME,
                    com.igsce.exam_service.config.RabbitConfig.ROUTING_KEY,
                    dto);
            System.out.println(">>> [ExamService] Message sent successfully!");

        } catch (Exception e) {
            System.err.println(">>> [ExamService] Exception sending to RabbitMQ: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Transactional
    public Exam createExam(CreateExamRequest request) {
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
            exam.setIsStrict(request.getIsStrict() != null ? request.getIsStrict() : false);

            List<Question> questions = new ArrayList<>();

            if (request.getQuestions() != null) {
                System.out.println("Processing " + request.getQuestions().size() + " questions");

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

            System.out.println("Saving exam to database...");
            Exam savedExam = examRepository.save(exam);
            System.out.println("Exam saved successfully with ID: " + savedExam.getExamId());
            try {
                ExamCreatedEvent event = new ExamCreatedEvent(
                        savedExam.getExamId(),
                        savedExam.getTitle(),
                        savedExam.getDescription());

                // Sử dụng Exchange chuyên cho notification (khai báo bên dưới)
                rabbitTemplate.convertAndSend("exam.notification.exchange", "exam.created", event);
                System.out.println(">>> Đã gửi sự kiện tạo Exam sang RabbitMQ: " + savedExam.getTitle());
            } catch (Exception ex) {
                System.err.println("Lỗi gửi RabbitMQ (không ảnh hưởng transaction chính): " + ex.getMessage());
            }

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
        boolean hasAiGraded = false;

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
                        ans.applyAiGrading(score, feedback != null ? feedback : "AI đã chấm");

                        // Lưu lại answer
                        answerRepository.save(ans);

                        System.out.println(">>> [ExamService] AI graded question " + questionId + ": " + score);

                        additionalScore += score;
                        updatedCount++;
                        hasAiGraded = true;
                        break;
                    }
                }
            }
        }

        System.out.println(
                ">>> [ExamService] Updated " + updatedCount + " answers. Additional Score: " + additionalScore);

        // Cộng thêm điểm tự luận vào tổng điểm
        attempt.setTotalScore(attempt.getTotalScore() + additionalScore);

        if (hasAiGraded) {
            attempt.setGradingStatus(GradingStatus.AI_GRADED);
        } else {
            // Nếu không có câu tự luận nào (hoặc lỗi), có thể coi là hoàn thành
            attempt.setGradingStatus(GradingStatus.COMPLETED);
        }

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
        exam.setIsStrict(request.getIsStrict() != null ? request.getIsStrict() : false);

        // 2. XỬ LÝ CẬP NHẬT CÂU HỎI (QUAN TRỌNG: KHÔNG DÙNG CLEAR())

        List<Question> currentQuestions = exam.getQuestions();
        List<QuestionRequest> newQuestionsData = request.getQuestions();

        if (newQuestionsData != null) {
            // A. Tạo map để tra cứu câu hỏi cũ cho nhanh
            Map<Long, Question> currentQuestionMap = new HashMap<>();
            for (Question q : currentQuestions) {
                currentQuestionMap.put(q.getQuestionId(), q);
            }

            // Danh sách các câu hỏi sẽ được giữ lại/thêm mới
            List<Question> updatedQuestions = new ArrayList<>();
            int currentIndex = 0;

            for (QuestionRequest qRequest : newQuestionsData) {
                Question question;

                // Kiểm tra xem câu hỏi này đã có trong DB chưa (dựa vào ID gửi lên)
                if (qRequest.getQuestionId() != null && currentQuestionMap.containsKey(qRequest.getQuestionId())) {
                    // --- CASE 1: CẬP NHẬT CÂU HỎI CŨ ---
                    question = currentQuestionMap.get(qRequest.getQuestionId());

                    // Xóa khỏi map để lát nữa biết câu nào không còn trong danh sách mới thì xóa đi
                    currentQuestionMap.remove(qRequest.getQuestionId());
                } else {
                    // --- CASE 2: TẠO CÂU HỎI MỚI ---
                    question = new Question();
                    question.setExam(exam); // Quan trọng
                }

                // Cập nhật thông tin fields
                question.setContent(qRequest.getContent());
                question.setScore(qRequest.getScore());
                question.setQuestionType(qRequest.getQuestionType());
                question.setOrderIndex(qRequest.getOrderIndex() != null ? qRequest.getOrderIndex() : currentIndex++);
                question.setImage(qRequest.getImage());

                if (qRequest.getQuestionType() == QuestionType.ESSAY) {
                    question.setEssayCorrectAnswer(qRequest.getEssayCorrectAnswer());
                }

                // --- XỬ LÝ OPTIONS (Tương tự logic Question để giữ lại Option ID cho Answers)
                // ---
                updateOptionsForQuestion(question, qRequest.getOptions());

                updatedQuestions.add(question);
            }

            // B. Xóa các câu hỏi cũ không còn nằm trong danh sách mới (Orphan Removal)
            // Những câu còn lại trong map là những câu đã bị user xóa trên giao diện
            currentQuestions.clear();
            currentQuestions.addAll(updatedQuestions);

            // Lưu ý: Hibernate sẽ tự động xóa các Question bị loại bỏ khỏi list nếu Entity
            // Exam có cài đặt orphanRemoval = true
        }

        return examRepository.save(exam);
    }

    // Helper method để cập nhật Options mà không làm mất ID
    private void updateOptionsForQuestion(Question question, List<OptionRequest> optionRequests) {
        if (optionRequests == null) {
            question.getOptions().clear();
            return;
        }

        List<QuestionOption> currentOptions = question.getOptions();
        if (currentOptions == null) {
            currentOptions = new ArrayList<>();
            question.setOptions(currentOptions);
        }

        // Map ID cũ
        Map<Long, QuestionOption> currentOptionMap = new HashMap<>();
        for (QuestionOption opt : currentOptions) {
            currentOptionMap.put(opt.getOptionId(), opt);
        }

        List<QuestionOption> updatedOptions = new ArrayList<>();

        for (OptionRequest optReq : optionRequests) {
            QuestionOption option;

            // Nếu Option có ID và tồn tại -> Update
            if (optReq.getOptionId() != null && currentOptionMap.containsKey(optReq.getOptionId())) {
                option = currentOptionMap.get(optReq.getOptionId());
            } else {
                // Nếu không -> Tạo mới
                option = new QuestionOption();
                option.setQuestion(question);
            }

            option.setContent(optReq.getContent());
            option.setCorrect(optReq.isCorrect());

            updatedOptions.add(option);
        }

        // Thay thế list cũ bằng list mới (Hibernate sẽ xử lý xóa các option thừa)
        currentOptions.clear();
        currentOptions.addAll(updatedOptions);
    }

}
