package com.igcse.ai.service.llm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.igcse.ai.dto.EssayAnswer;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.service.OpenAiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.igcse.ai.service.common.LanguageService;

/**
 * Service để gọi OpenAI API phân tích câu trả lời tự luận
 * Hỗ trợ đa ngôn ngữ (tiếng Anh và tiếng Việt)
 */
@Service
public class OpenAIService {

    private static final Logger logger = LoggerFactory.getLogger(OpenAIService.class);
    private final OpenAiService openAiService;
    private final ObjectMapper objectMapper;
    private LanguageService languageService;

    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    public OpenAIService(@Value("${openai.api.key}") String apiKey,
            @Value("${openai.api.timeout:60}") int timeoutSeconds) {
        logger.info("Initializing OpenAIService with API key: {}",
                apiKey != null ? apiKey.substring(0, Math.min(10, apiKey.length())) + "..." : "NULL");
        // Nếu API key là placeholder hoặc invalid, dùng fallback logic
        if (apiKey == null || apiKey.equals("your-api-key-here") ||
                apiKey.startsWith("invalid-") || apiKey.startsWith("test-") ||
                (apiKey.length() < 20 || !apiKey.startsWith("sk-"))) {
            this.openAiService = null; // Sẽ dùng fallback logic
            logger.warn("OpenAI API key is invalid or placeholder - using fallback logic");
        } else {
            this.openAiService = new OpenAiService(apiKey, Duration.ofSeconds(timeoutSeconds));
            logger.info("OpenAI API Service initialized successfully");
        }
        this.objectMapper = new ObjectMapper();
    }

    @Autowired
    public void setLanguageService(LanguageService languageService) {
        this.languageService = languageService;
    }

    /**
     * Phân tích và chấm điểm câu trả lời tự luận bằng OpenAI
     * 
     * @param essayAnswer - Câu trả lời tự luận
     * @return Map chứa score, feedback và usedOpenAI flag
     */
    public Map<String, Object> gradeEssayAnswer(EssayAnswer essayAnswer) {
        return gradeEssayAnswer(essayAnswer, LanguageService.DEFAULT_LANGUAGE);
    }

    /**
     * Phân tích và chấm điểm câu trả lời tự luận bằng OpenAI với ngôn ngữ chỉ định
     * 
     * @param essayAnswer - Câu trả lời tự luận
     * @param language    - Ngôn ngữ ("en" hoặc "vi")
     * @return Map chứa score, feedback và usedOpenAI flag
     */
    public Map<String, Object> gradeEssayAnswer(EssayAnswer essayAnswer, String language) {
        // Normalize language
        String lang = languageService != null ? languageService.normalizeLanguage(language) : "en";

        // Nếu không có OpenAI service (API key chưa config), dùng logic fallback
        if (openAiService == null) {
            logger.warn("OpenAI service is null, using fallback grading for question: {}", essayAnswer.getQuestionId());
            return gradeEssayFallback(essayAnswer, lang);
        }

        logger.info("Using OpenAI API to grade essay for question: {}", essayAnswer.getQuestionId());
        try {
            // Tạo prompt cho OpenAI với ngôn ngữ chỉ định
            String prompt = buildGradingPrompt(essayAnswer, lang);
            String systemPrompt = languageService != null ? languageService.getSystemPrompt(lang)
                    : (LanguageService.AUTO.equals(lang)
                            ? "You are an expert IGCSE examiner. Detect the student's language and provide constructive feedback in that same language."
                            : "You are an expert IGCSE examiner. Grade student answers accurately and provide constructive feedback.");

            List<ChatMessage> messages = new ArrayList<>();
            messages.add(new ChatMessage(ChatMessageRole.SYSTEM.value(), systemPrompt));
            messages.add(new ChatMessage(ChatMessageRole.USER.value(), prompt));

            ChatCompletionRequest request = ChatCompletionRequest.builder()
                    .model(model)
                    .messages(messages)
                    .temperature(0.3) // Thấp hơn để chấm điểm chính xác hơn
                    .maxTokens(500)
                    .build();

            String response = openAiService.createChatCompletion(request)
                    .getChoices()
                    .get(0)
                    .getMessage()
                    .getContent();

            // Parse response từ OpenAI
            Map<String, Object> result = parseGradingResponse(response, essayAnswer.getMaxScore());
            result.put("usedOpenAI", true);
            logger.info("OpenAI API grading SUCCESS for question: {}", essayAnswer.getQuestionId());
            return result;

        } catch (Exception e) {
            // Nếu OpenAI API fail, fallback về logic tự viết
            logger.error("OpenAI API error for question {}: {}", essayAnswer.getQuestionId(), e.getMessage(), e);
            return gradeEssayFallback(essayAnswer, lang);
        }
    }

    /**
     * Tạo prompt cho OpenAI với hỗ trợ đa ngôn ngữ
     */
    private String buildGradingPrompt(EssayAnswer essayAnswer, String language) {
        StringBuilder prompt = new StringBuilder();

        if (LanguageService.VIETNAMESE.equals(language)) {
            prompt.append("Câu hỏi: ").append(essayAnswer.getQuestionText()).append("\n\n");
            prompt.append("Câu trả lời của học sinh: ").append(essayAnswer.getStudentAnswer()).append("\n\n");

            if (essayAnswer.getReferenceAnswer() != null && !essayAnswer.getReferenceAnswer().isEmpty()) {
                prompt.append("Đáp án tham khảo: ").append(essayAnswer.getReferenceAnswer()).append("\n\n");
            }

            prompt.append("Điểm tối đa: ").append(essayAnswer.getMaxScore()).append("\n\n");
            prompt.append("Vui lòng chấm điểm câu trả lời này và cung cấp:\n");
            prompt.append("1. Điểm số (tối đa ").append(essayAnswer.getMaxScore()).append(")\n");
            prompt.append("2. Nhận xét chi tiết về điểm mạnh và điểm cần cải thiện\n");
            prompt.append("Trả lời bằng tiếng Việt với format JSON: {\"score\": X, \"feedback\": \"...\"}");
        } else if (LanguageService.ENGLISH.equals(language)) {
            prompt.append("Question: ").append(essayAnswer.getQuestionText()).append("\n\n");
            prompt.append("Student Answer: ").append(essayAnswer.getStudentAnswer()).append("\n\n");

            if (essayAnswer.getReferenceAnswer() != null && !essayAnswer.getReferenceAnswer().isEmpty()) {
                prompt.append("Reference Answer: ").append(essayAnswer.getReferenceAnswer()).append("\n\n");
            }

            prompt.append("Maximum Score: ").append(essayAnswer.getMaxScore()).append("\n\n");
            prompt.append("Please grade this answer and provide:\n");
            prompt.append("1. Score (out of ").append(essayAnswer.getMaxScore()).append(")\n");
            prompt.append("2. Detailed feedback explaining strengths and weaknesses\n");
            prompt.append("Format your response as JSON: {\"score\": X, \"feedback\": \"...\"}");
        } else {
            // Default to AUTO logic
            prompt.append("Question: ").append(essayAnswer.getQuestionText()).append("\n\n");
            prompt.append("Student Answer: ").append(essayAnswer.getStudentAnswer()).append("\n\n");

            if (essayAnswer.getReferenceAnswer() != null && !essayAnswer.getReferenceAnswer().isEmpty()) {
                prompt.append("Reference Answer: ").append(essayAnswer.getReferenceAnswer()).append("\n\n");
            }

            prompt.append("Maximum Score: ").append(essayAnswer.getMaxScore()).append("\n\n");
            prompt.append(
                    "Please evaluate the student's answer. Detect whether the student answered in English, Vietnamese, or another language.\n");
            prompt.append("Provide your feedback in the SAME LANGUAGE used by the student.\n\n");
            prompt.append("Format your response as JSON: {\"score\": X, \"feedback\": \"...\"}");
        }

        return prompt.toString();
    }

    /**
     * Parse response từ OpenAI
     */
    private Map<String, Object> parseGradingResponse(String response, Double maxScore) {
        Map<String, Object> result = new HashMap<>();

        try {
            // Làm sạch output (loại bỏ ```json ... ``` nếu có) rồi parse JSON
            String cleaned = sanitizeJson(response);
            Map<String, Object> jsonResponse = objectMapper.readValue(
                    cleaned,
                    objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class));

            Object scoreObj = jsonResponse.get("score");
            Double score = null;
            if (scoreObj instanceof Number) {
                score = ((Number) scoreObj).doubleValue();
            } else if (scoreObj instanceof String) {
                score = Double.parseDouble((String) scoreObj);
            }

            String feedback = (String) jsonResponse.get("feedback");

            // Đảm bảo score không vượt quá maxScore
            score = score != null ? Math.min(Math.max(score, 0.0), maxScore) : maxScore * 0.7;

            result.put("score", score);
            result.put("feedback", feedback != null ? feedback : "No feedback provided.");

        } catch (Exception e) {
            // Nếu không parse được JSON, dùng fallback
            System.err.println("Failed to parse OpenAI response: " + e.getMessage());
            result.put("score", maxScore * 0.7); // Cho điểm trung bình
            result.put("feedback", "AI analysis completed. " + response);
        }

        return result;
    }

    /**
     * Loại bỏ code fence ```json ... ``` và trim khoảng trắng trước khi parse
     */
    private String sanitizeJson(String response) {
        if (response == null) {
            return "";
        }
        String cleaned = response.trim();
        cleaned = cleaned.replaceAll("(?s)^```(?:json)?\\s*", "");
        cleaned = cleaned.replaceAll("```\\s*$", "");
        return cleaned.trim();
    }

    /**
     * Logic fallback khi không có OpenAI API
     * Sử dụng keyword matching và length analysis
     */
    private Map<String, Object> gradeEssayFallback(EssayAnswer essayAnswer, String language) {
        Map<String, Object> result = new HashMap<>();
        boolean isVietnamese = LanguageService.VIETNAMESE.equals(language);

        String studentAnswer = essayAnswer.getStudentAnswer();
        String referenceAnswer = essayAnswer.getReferenceAnswer();
        Double maxScore = essayAnswer.getMaxScore();

        if (studentAnswer == null || studentAnswer.trim().isEmpty()) {
            result.put("score", 0.0);
            result.put("feedback", isVietnamese ? "Câu trả lời trống. Vui lòng cung cấp câu trả lời đầy đủ."
                    : "Empty answer. Please provide a complete answer.");
            result.put("usedOpenAI", false);
            return result;
        }

        // Tính điểm dựa trên độ dài và keyword matching
        double score = 0.0;
        StringBuilder feedback = new StringBuilder();

        // Độ dài câu trả lời (30% điểm)
        int answerLength = studentAnswer.trim().length();
        int minLength = 50; // Tối thiểu 50 ký tự
        double lengthScore = Math.min(1.0, answerLength / (double) minLength) * 0.3;

        // Keyword matching với đáp án tham khảo (70% điểm)
        double keywordScore = 0.0;
        if (referenceAnswer != null && !referenceAnswer.isEmpty()) {
            keywordScore = calculateKeywordMatch(studentAnswer, referenceAnswer) * 0.7;
        } else {
            // Nếu không có đáp án tham khảo, cho điểm dựa trên độ dài
            keywordScore = lengthScore * 2.33; // Scale lên để tổng = 1.0
        }

        score = (lengthScore + keywordScore) * maxScore;
        score = Math.min(score, maxScore);
        score = Math.max(score, 0.0);

        // Tạo feedback theo ngôn ngữ
        if (isVietnamese) {
            feedback.append("[Logic local] Đã chấm điểm tự động. ");
            if (answerLength < minLength) {
                feedback.append("Câu trả lời cần chi tiết hơn. ");
            }
            if (keywordScore < 0.5) {
                feedback.append("Cần tập trung vào các điểm chính của câu hỏi. ");
            }
            feedback.append("Tiếp tục cố gắng!");
        } else {
            feedback.append("[Logic local] Auto-graded. ");
            if (answerLength < minLength) {
                feedback.append("Answer needs more detail. ");
            }
            if (keywordScore < 0.5) {
                feedback.append("Focus on the main points of the question. ");
            }
            feedback.append("Keep trying!");
        }

        result.put("score", score);
        result.put("feedback", feedback.toString());
        result.put("usedOpenAI", false);

        return result;
    }

    /**
     * Tính điểm dựa trên keyword matching
     */
    private double calculateKeywordMatch(String studentAnswer, String referenceAnswer) {
        String[] studentWords = studentAnswer.toLowerCase().split("\\s+");
        String[] referenceWords = referenceAnswer.toLowerCase().split("\\s+");

        int matches = 0;
        for (String refWord : referenceWords) {
            if (refWord.length() > 3) { // Chỉ match từ dài hơn 3 ký tự
                for (String stuWord : studentWords) {
                    if (stuWord.contains(refWord) || refWord.contains(stuWord)) {
                        matches++;
                        break;
                    }
                }
            }
        }

        return referenceWords.length > 0 ? (double) matches / referenceWords.length : 0.0;
    }
}
