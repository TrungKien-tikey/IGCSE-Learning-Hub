package com.igcse.ai.config;

import com.igcse.ai.service.llm.LangChainConfidenceEvaluator;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class LangChain4jConfig {

    @Value("${openai.api.key}")
    private String openaiApiKey;

    @Value("${openai.model:gpt-4o-mini}")
    private String modelName;

    @Value("${openai.api.timeout:60}")
    private int timeoutSeconds;

    @Bean
    public LangChainConfidenceEvaluator confidenceEvaluator() {
        // Nếu không có API Key hoặc key là placeholder/invalid, trả về null
        // Match logic từ OpenAIService để consistency
        if (openaiApiKey == null || openaiApiKey.trim().isEmpty() || 
            "your-api-key-here".equals(openaiApiKey) ||
            openaiApiKey.startsWith("invalid-") || openaiApiKey.startsWith("test-") ||
            (openaiApiKey.length() < 20 || !openaiApiKey.startsWith("sk-"))) {
            return null;
        }

        ChatLanguageModel model = OpenAiChatModel.builder()
                .apiKey(openaiApiKey)
                .modelName(modelName)
                .temperature(0.3) // Nhiệt độ thấp để đánh giá ổn định
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .logRequests(true)
                .logResponses(true)
                .build();

        return AiServices.builder(LangChainConfidenceEvaluator.class)
                .chatLanguageModel(model)
                .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
                .build();
    }
}
