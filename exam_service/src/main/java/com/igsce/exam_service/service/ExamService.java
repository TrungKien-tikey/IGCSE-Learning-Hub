package com.igsce.exam_service.service;

import lombok.*;
import java.util.*;
import java.util.Objects;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    private static final Logger logger = LoggerFactory.getLogger(ExamService.class);

    private final ExamRepository examRepository;
    private final ExamAttemptRepository attemptRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final org.springframework.web.client.RestTemplate restTemplate;
    private final String aiServiceUrl;
    private final AIServiceClient aiServiceClient;

    public ExamService(ExamRepository examRepository,
            ExamAttemptRepository attemptRepository,
            QuestionRepository questionRepository,
            AnswerRepository answerRepository,
            org.springframework.web.client.RestTemplate restTemplate,
            @org.springframework.beans.factory.annotation.Value("${ai.service.url}") String aiServiceUrl,
            AIServiceClient aiServiceClient) {
        this.examRepository = examRepository;
        this.attemptRepository = attemptRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.restTemplate = restTemplate;
        this.aiServiceUrl = aiServiceUrl;
        this.aiServiceClient = aiServiceClient;
    }

    @Transactional(readOnly = true)
    public List<Exam> getAllExams() {
        try {
            List<Exam> exams = examRepository.findAll();
            // Initialize lazy collections trong transaction để tránh LazyInitializationException
            exams.forEach(exam -> {
                if (exam.getQuestions() != null) {
                    exam.getQuestions().size(); // Force load
                }
            });
            return exams;
        } catch (Exception e) {
            logger.error("Error getting all exams", e);
            throw new RuntimeException("Failed to get exams: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public Exam getExamById(Long examId) {
        try {
            Exam exam = examRepository.findById(examId)
                    .orElseThrow(() -> new RuntimeException("Exam not found with id: " + examId));
            // Initialize lazy collections trong transaction
            if (exam.getQuestions() != null) {
                exam.getQuestions().size(); // Force load
            }
            return exam;
        } catch (Exception e) {
            logger.error("Error getting exam by id: {}", examId, e);
            throw new RuntimeException("Failed to get exam: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public ExamAttempt getExamAttempt(Long attemptId) {
        try {
            ExamAttempt attempt = attemptRepository.findById(attemptId)
                    .orElseThrow(() -> new IllegalArgumentException("Attempt not found: " + attemptId));
            
            // Force load tất cả lazy collections để tránh LazyInitializationException
            if (attempt.getAnswers() != null) {
                int answerCount = attempt.getAnswers().size(); // Force load answers
                
                // Xử lý duplicate answers: Nếu có nhiều answers cho cùng questionId, chỉ giữ 1 answer
                // Ưu tiên: answer có score cao nhất, nếu bằng nhau thì lấy answerId lớn nhất (mới nhất)
                Map<Long, Answer> deduplicatedAnswers = attempt.getAnswers().stream()
                        .collect(Collectors.toMap(
                            answer -> answer.getQuestion().getQuestionId(),
                            answer -> answer,
                            (existing, replacement) -> {
                                // Nếu có duplicate, giữ answer có score cao hơn
                                if (replacement.getScore() > existing.getScore()) {
                                    logger.warn("⚠️ Duplicate answer found for questionId: {} in attemptId: {}. " +
                                               "Keeping answer with higher score: answerId={} (score={}) instead of answerId={} (score={})",
                                               replacement.getQuestion().getQuestionId(), attemptId,
                                               replacement.getAnswerId(), replacement.getScore(),
                                               existing.getAnswerId(), existing.getScore());
                                    return replacement;
                                } else if (replacement.getScore() == existing.getScore() && 
                                          replacement.getAnswerId() > existing.getAnswerId()) {
                                    // Nếu score bằng nhau, giữ answer mới hơn (answerId lớn hơn)
                                    logger.warn("⚠️ Duplicate answer found for questionId: {} in attemptId: {}. " +
                                               "Keeping newer answer: answerId={} instead of answerId={}",
                                               replacement.getQuestion().getQuestionId(), attemptId,
                                               replacement.getAnswerId(), existing.getAnswerId());
                                    return replacement;
                                }
                                return existing;
                            }
                        ));
                
                // Cập nhật lại answers list sau khi deduplicate
                attempt.setAnswers(new ArrayList<>(deduplicatedAnswers.values()));
                logger.debug("Deduplicated answers: {} -> {} answers", answerCount, deduplicatedAnswers.size());
                
                // Force load nested entities trong answers
                for (Answer answer : attempt.getAnswers()) {
                    if (answer.getQuestion() != null) {
                        Question q = answer.getQuestion();
                        // Force load question options nếu có
                        if (q.getOptions() != null) {
                            q.getOptions().size();
                        }
                        // Đảm bảo essayCorrectAnswer được load (không lazy, nhưng cần force access)
                        if (q.getQuestionType() == QuestionType.ESSAY) {
                            String refAnswer = q.getEssayCorrectAnswer(); // Force access
                            logger.debug("Loaded essay question {} with reference answer: {}", 
                                        q.getQuestionId(), 
                                        refAnswer != null ? "✓" : "✗");
                        }
                    }
                }
            }
            
            // Force load exam và questions
            if (attempt.getExam() != null) {
                Exam exam = attempt.getExam();
                if (exam.getQuestions() != null) {
                    int questionCount = exam.getQuestions().size(); // Force load questions
                    // Force load options cho từng question
                    for (Question question : exam.getQuestions()) {
                        if (question.getOptions() != null) {
                            question.getOptions().size();
                        }
                    }
                }
            }
            
            logger.debug("Loaded exam attempt {} with {} answers", attemptId, 
                    attempt.getAnswers() != null ? attempt.getAnswers().size() : 0);
            return attempt;
        } catch (Exception e) {
            logger.error("Error getting exam attempt: {}", attemptId, e);
            throw new RuntimeException("Failed to get exam attempt: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Exam createExam(CreateExamRequest request) {
        Exam exam = new Exam();
        exam.setTitle(request.getTitle());
        exam.setDescription(request.getDescription());
        exam.setDuration(request.getDuration());
        exam.setActive(request.isActive());
        exam.setEndTime(request.getEndTime()); // Set endTime nếu có

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
                
                // Lưu đáp án tham khảo cho câu ESSAY (dùng cho AI chấm điểm)
                if (qRequest.getEssayCorrectAnswer() != null) {
                    question.setEssayCorrectAnswer(qRequest.getEssayCorrectAnswer());
                }

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

    public ExamAttempt startExam(Long examId, Long userId) {

        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        if (!exam.isActive()) {
            throw new RuntimeException("Exam is not active");
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
        logger.info("Submitting exam for attemptId: {}", attemptId);
        
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found: " + attemptId));

        // Lấy các answers hiện có để tránh duplicate
        List<Answer> existingAnswers = answerRepository.findByAttemptAttemptId(attemptId);
        Map<Long, Answer> existingAnswerMap = existingAnswers.stream()
                .collect(Collectors.toMap(
                    answer -> answer.getQuestion().getQuestionId(),
                    answer -> answer,
                    (existing, replacement) -> existing // Nếu duplicate, giữ answer cũ hơn
                ));

        double totalScore = 0;
        List<Answer> answersToSave = new ArrayList<>();
        boolean hasEssayQuestions = false;

        for (StudentAnswerDTO dto : userAnswers) {
            Question question = questionRepository.findById(dto.getQuestionId()).orElse(null);
            if (question == null) {
                logger.warn("Question not found for questionId: {}", dto.getQuestionId());
                continue;
            }

            // Kiểm tra xem đã có answer cho question này chưa
            Answer answer = existingAnswerMap.get(dto.getQuestionId());
            if (answer == null) {
                // Tạo answer mới nếu chưa có
                answer = new Answer();
                answer.setAttempt(attempt);
                answer.setQuestion(question);
            } else {
                // Update answer cũ nếu đã có (tránh duplicate)
                logger.debug("Updating existing answer for questionId: {} in attemptId: {}", 
                            dto.getQuestionId(), attemptId);
            }

            double score = 0;

            // --- LOGIC CHẤM ĐIỂM ---
            if (question.getQuestionType() == QuestionType.MCQ) {
                // 1. Xử lý Trắc nghiệm
                answer.setSelectedOptionId(dto.getSelectedOptionId());
                answer.setTextAnswer(null); // Clear text answer nếu là MCQ

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
                answer.setSelectedOptionId(null); // Clear selected option nếu là ESSAY
                // Tự luận sẽ được chấm bằng AI sau -> score = 0 tạm thời (trừ khi đã có điểm từ AI)
                if (answer.getScore() == 0) {
                    score = 0; // Giữ score = 0 nếu chưa có điểm từ AI
                } else {
                    score = answer.getScore(); // Giữ nguyên điểm nếu đã có từ AI
                }
                hasEssayQuestions = true;
            }

            answer.setScore(score);
            totalScore += score;
            answersToSave.add(answer);
        }

        // Xóa các answers cũ không còn trong userAnswers (nếu có)
        Set<Long> answeredQuestionIds = userAnswers.stream()
                .map(StudentAnswerDTO::getQuestionId)
                .collect(Collectors.toSet());
        
        List<Answer> answersToDelete = existingAnswers.stream()
                .filter(answer -> !answeredQuestionIds.contains(answer.getQuestion().getQuestionId()))
                .collect(Collectors.toList());
        
        if (!answersToDelete.isEmpty()) {
            logger.debug("Removing {} old answers not in current submission", answersToDelete.size());
            answerRepository.deleteAll(answersToDelete);
        }

        attempt.setAnswers(answersToSave);
        attempt.setTotalScore(totalScore);
        attempt.submit();
        attemptRepository.save(attempt);

        logger.info("Exam submitted successfully. AttemptId: {}, TotalScore (MCQ only): {}, HasEssay: {}", 
                attemptId, totalScore, hasEssayQuestions);

        // Kích hoạt chấm điểm AI (bất đồng bộ) nếu có câu tự luận
        if (hasEssayQuestions) {
            triggerAIGrading(attemptId);
        } else {
            logger.debug("No essay questions found, skipping AI grading for attemptId: {}", attemptId);
        }

        return true;
    }

    /**
     * Gọi AI Service để chấm điểm các câu tự luận (ESSAY)
     * Method này chạy bất đồng bộ để không block việc nộp bài
     * 
     * Flow:
     * 1. Exam Service gọi AI Service: POST /api/ai/mark-exam/{attemptId}
     * 2. AI Service chấm điểm và gọi callback về: POST /api/exams/grading-result
     * 3. Exam Service cập nhật điểm ESSAY vào database
     * 
     * @param attemptId ID của lượt làm bài cần chấm điểm
     */
    @Async("taskExecutor")
    public void triggerAIGrading(Long attemptId) {
        logger.info("🚀 Triggering AI grading for attemptId: {}", attemptId);
        try {
            String url = aiServiceUrl + "/api/ai/mark-exam/" + attemptId + "?language=auto";
            logger.debug("Calling AI service: {}", url);
            
            // Gọi AI Service để chấm điểm
            // AI Service sẽ tự động gọi callback về /api/exams/grading-result khi xong
            var response = restTemplate.postForEntity(url, null, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("✅ AI grading request sent successfully for attemptId: {}. " +
                           "AI Service will process and callback when done.", attemptId);
            } else {
                logger.warn("⚠️ AI Service returned non-2xx status for attemptId: {}. Status: {}", 
                           attemptId, response.getStatusCode());
            }
        } catch (org.springframework.web.client.ResourceAccessException e) {
            // Timeout hoặc không kết nối được
            logger.error("❌ Failed to connect to AI Service for attemptId: {}. " +
                        "Error: {}. AI Service may be down or unreachable.", 
                        attemptId, e.getMessage());
        } catch (org.springframework.web.client.HttpServerErrorException e) {
            // AI Service lỗi 5xx
            logger.error("❌ AI Service returned server error for attemptId: {}. " +
                        "Status: {}, Response: {}", 
                        attemptId, e.getStatusCode(), e.getResponseBodyAsString());
        } catch (Exception e) {
            logger.error("❌ Failed to trigger AI grading for attemptId: {}. Error: {}", 
                        attemptId, e.getMessage(), e);
        }
        // Không throw exception để không làm fail việc nộp bài
        // Điểm ESSAY sẽ là 0 nếu AI Service không chấm được
    }

    @Transactional
    public boolean updateGradingResult(GradingResultDTO gradingResult) {
        logger.info("Updating grading result for attemptId: {}", gradingResult.getAttemptId());
        
        Objects.requireNonNull(gradingResult.getAttemptId(), "AttemptId cannot be null");
        Objects.requireNonNull(gradingResult.getAnswerScores(), "AnswerScores cannot be null");

        ExamAttempt attempt = attemptRepository.findById(gradingResult.getAttemptId())
                .orElseThrow(() -> new RuntimeException("Attempt not found: " + gradingResult.getAttemptId()));

        if (attempt.getAnswers() == null || attempt.getAnswers().isEmpty()) {
            logger.warn("No answers found for attemptId: {}", gradingResult.getAttemptId());
            return false;
        }

        // Tạo map để tìm Answer nhanh hơn
        // Nếu có duplicate (nhiều answers cho cùng questionId), lấy answer có score cao nhất hoặc mới nhất
        Map<Long, Answer> answerMap = attempt.getAnswers().stream()
                .collect(Collectors.toMap(
                    answer -> answer.getQuestion().getQuestionId(),
                    answer -> answer,
                    (existing, replacement) -> {
                        // Nếu có duplicate, giữ answer có score cao hơn hoặc mới hơn (answerId lớn hơn)
                        if (replacement.getScore() > existing.getScore() || 
                            (replacement.getScore() == existing.getScore() && 
                             replacement.getAnswerId() > existing.getAnswerId())) {
                            logger.warn("Found duplicate answers for questionId: {}. Keeping answer with higher score/newer: answerId={}",
                                       replacement.getQuestion().getQuestionId(), replacement.getAnswerId());
                            return replacement;
                        }
                        return existing;
                    }
                ));

        double totalScore = 0;
        int updatedCount = 0;

        // Cập nhật điểm cho từng câu ESSAY
        for (AnswerScoreDTO answerScore : gradingResult.getAnswerScores()) {
            Answer answer = answerMap.get(answerScore.getQuestionId());
            if (answer == null) {
                logger.warn("Answer not found for questionId: {} in attemptId: {}", 
                        answerScore.getQuestionId(), gradingResult.getAttemptId());
                continue;
            }

            // Chỉ cập nhật nếu là câu ESSAY (có textAnswer)
            if (answer.getQuestion().getQuestionType() == QuestionType.ESSAY) {
                answer.setScore(answerScore.getScore());
                answerRepository.save(answer);
                totalScore += answerScore.getScore();
                updatedCount++;
                logger.debug("Updated score for questionId: {} to {}", 
                        answerScore.getQuestionId(), answerScore.getScore());
            } else {
                // Giữ nguyên điểm MCQ đã tính
                totalScore += answer.getScore();
            }
        }

        // Tính lại totalScore: MCQ (đã có) + ESSAY (vừa cập nhật)
        // Lấy lại tất cả answers để tính chính xác
        double finalTotalScore = attempt.getAnswers().stream()
                .mapToDouble(Answer::getScore)
                .sum();

        attempt.setTotalScore(finalTotalScore);
        attemptRepository.save(attempt);

        logger.info("Grading result updated successfully. AttemptId: {}, Updated answers: {}, Final totalScore: {}", 
                gradingResult.getAttemptId(), updatedCount, finalTotalScore);

        return true;
    }

    /**
     * Lấy kết quả chấm điểm từ AI Service
     * Lấy dữ liệu từ ai_db.ai_results thông qua REST API
     * 
     * @param attemptId ID của lượt làm bài
     * @return AIGradingResultDTO chứa score, feedback, confidence, language, etc.
     */
    public AIGradingResultDTO getAIGradingResult(Long attemptId) {
        logger.debug("Getting AI grading result for attemptId: {}", attemptId);
        return aiServiceClient.getAIGradingResult(attemptId);
    }

    /**
     * Lấy kết quả chấm điểm chi tiết từ AI Service
     * Bao gồm feedback cho từng câu hỏi
     * 
     * @param attemptId ID của lượt làm bài
     * @return Map chứa chi tiết kết quả chấm điểm
     */
    public Map<String, Object> getDetailedAIGradingResult(Long attemptId) {
        logger.debug("Getting detailed AI grading result for attemptId: {}", attemptId);
        return aiServiceClient.getDetailedAIGradingResult(attemptId);
    }

}
