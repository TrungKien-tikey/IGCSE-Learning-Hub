package com.igcse.ai.config;

import com.igcse.ai.exception.AIServiceException; // Import AIServiceException
import com.igcse.ai.service.llm.EssayGradingAiService;
import com.igcse.ai.service.llm.InsightAiService;
import com.igcse.ai.service.llm.RecommendationAiService;

// import org.slf4j.Logger; // Import Logger
// import org.slf4j.LoggerFactory; // Import LoggerFactory
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

    // private static final Logger logger =
    // LoggerFactory.getLogger(LangChain4jConfig.class); // Add Logger

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

    private ChatLanguageModel createChatModel(double temperature) {
        if (openaiApiKey == null || openaiApiKey.trim().isEmpty() ||
                "your-api-key-here".equals(openaiApiKey) ||
                openaiApiKey.startsWith("invalid-")) {
            // Thay vì throw exception làm crash app, ta log warning và dùng key dummy
            // App vẫn khởi động được, nhưng chức năng AI sẽ lỗi (và rơi vào fallback)
            System.err.println(
                    "CẢNH BÁO: OpenAI API Key chưa được cấu hình hoặc không hợp lệ. Các chức năng AI sẽ không hoạt động.");
            openaiApiKey = "demo-key-to-prevent-startup-crash";
        }

        return OpenAiChatModel.builder()
                .apiKey(openaiApiKey)
                .modelName(modelName)
                .temperature(temperature) // Dùng tham số truyền vào
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .logRequests(logRequests)
                .logResponses(logResponses)
                .build();
    }

    @Bean
    public EssayGradingAiService essayGradingAiService() {
        return AiServices.builder(EssayGradingAiService.class)
                .chatLanguageModel(createChatModel(0.3)) // Chấm điểm cần chính xác cao
                .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
                .build();
    }

    @Bean
    public InsightAiService insightAiService() {
        return AiServices.builder(InsightAiService.class)
                .chatLanguageModel(createChatModel(0.5)) // Phân tích cần sự linh hoạt hơn
                .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
                .build();
    }

    @Bean
    public RecommendationAiService recommendationAiService() {
        return AiServices.builder(RecommendationAiService.class)
                .chatLanguageModel(createChatModel(0.5))
                .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
                .build();
    }
}
