package com.igcse.auth.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // ========================================================================
    // 1. PRODUCER: Auth Service gửi event "User Created" sang User Service
    // ========================================================================
    public static final String USER_EXCHANGE = "user.exchange";
    public static final String USER_SYNC_QUEUE = "user.sync.queue";
    public static final String USER_SYNC_ROUTING_KEY = "user.sync.routing.key";

    @Bean
    public TopicExchange userExchange() {
        return new TopicExchange(USER_EXCHANGE);
    }

    @Bean
    public Queue userSyncQueue() {
        return new Queue(USER_SYNC_QUEUE);
    }

    @Bean
    public Binding binding(Queue userSyncQueue, TopicExchange userExchange) {
        return BindingBuilder.bind(userSyncQueue).to(userExchange).with(USER_SYNC_ROUTING_KEY);
    }

    // ========================================================================
    // 2. CONSUMER: Auth Service nhận event "Update Role" từ User Service
    // ========================================================================
    public static final String USER_UPDATE_EXCHANGE = "user.update.exchange";
    public static final String AUTH_USER_UPDATE_QUEUE = "auth.user.update.queue";
    public static final String USER_UPDATE_ROUTING_KEY = "user.update.routing.key";

    @Bean
    public TopicExchange userUpdateExchange() {
        return new TopicExchange(USER_UPDATE_EXCHANGE);
    }

    @Bean
    public Queue authUserUpdateQueue() {
        return new Queue(AUTH_USER_UPDATE_QUEUE);
    }

    @Bean
    public Binding authUpdateBinding(Queue authUserUpdateQueue, TopicExchange userUpdateExchange) {
        return BindingBuilder.bind(authUserUpdateQueue)
                .to(userUpdateExchange)
                .with(USER_UPDATE_ROUTING_KEY);
    }

    // ========================================================================
    // 3. COMMON: Bộ chuyển đổi tin nhắn sang JSON (Dùng chung cho cả 2 chiều)
    // ========================================================================
    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}