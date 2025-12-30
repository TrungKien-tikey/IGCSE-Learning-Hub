package com.igcse.communication.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint để Frontend kết nối vào. 
        // setAllowedOriginPatterns("*") để cho phép chạy file HTML local connect được.
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefix cho các đường dẫn mà Client gửi lên Server (VD: /app/chat)
        registry.setApplicationDestinationPrefixes("/app");
        
        // Prefix cho các đường dẫn mà Server gửi về Client (VD: /topic/public hoặc /queue/private)
        // /queue thường dùng cho nhắn tin 1-1
        registry.enableSimpleBroker("/topic", "/queue");
    }
}