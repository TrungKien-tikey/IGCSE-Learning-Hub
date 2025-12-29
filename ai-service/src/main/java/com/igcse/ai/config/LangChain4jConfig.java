package com.igcse.ai.config;

import com.igcse.ai.service.llm.LangChainConfidenceEvaluator;
import com.igcse.ai.exception.AIServiceException; // Import AIServiceException
import org.slf4j.Logger; // Import Logger
import org.slf4j.LoggerFactory; // Import LoggerFactory
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class LangChain4jConfig {

    private static final Logger logger = LoggerFactory.getLogger(LangChain4jConfig.class); // Add Logger

    @Value("${openai.api.key}")
    private String openaiApiKey;

    @Value("${openai.model:gpt-4o-mini}")
    private String modelName;

    @Value("${openai.api.timeout:60}")
    private int timeoutSeconds;

    @Value("${openai.log.requests:false}") // Mặc định tắt logging requests
    private boolean logRequests;

    @Value("${openai.log.responses:false}") // Mặc định tắt logging responses
    private boolean logResponses;

    @Bean
    public LangChainConfidenceEvaluator confidenceEvaluator() {
        // Nếu không có API Key hoặc key là placeholder/invalid, ném ngoại lệ
        if (openaiApiKey == null || openaiApiKey.trim().isEmpty() || 
            "your-api-key-here".equals(openaiApiKey) ||
            openaiApiKey.startsWith("invalid-") || openaiApiKey.startsWith("test-") ||
            (openaiApiKey.length() < 20 || !openaiApiKey.startsWith("sk-"))) {
            logger.error("OpenAI API Key không hợp lệ hoặc thiếu. Vui lòng kiểm tra thuộc tính 'openai.api.key'.");
            throw new AIServiceException("OpenAI API Key không hợp lệ hoặc thiếu.");
        }

        ChatLanguageModel model = OpenAiChatModel.builder()
                .apiKey(openaiApiKey)
                .modelName(modelName)
                .temperature(0.3) // Nhiệt độ thấp để đánh giá ổn định
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .logRequests(logRequests) // Sử dụng giá trị cấu hình
                .logResponses(logResponses) // Sử dụng giá trị cấu hình
                .build();

        return AiServices.builder(LangChainConfidenceEvaluator.class)
                .chatLanguageModel(model)
                .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
                .build();
    }
}
