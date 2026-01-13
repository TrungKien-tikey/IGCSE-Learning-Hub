package com.igcse.user.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Queue để nhận user mới từ Auth Service
    public static final String USER_SYNC_QUEUE = "user.sync.queue";

    // Exchange và Routing Key để gửi update/delete về Auth Service
    public static final String USER_UPDATE_EXCHANGE = "user.update.exchange";
    public static final String USER_UPDATE_ROUTING_KEY = "user.update.routing.key";

    @Bean
    public Queue userSyncQueue() {
        return new Queue(USER_SYNC_QUEUE);
    }

    @Bean
    public TopicExchange userUpdateExchange() {
        return new TopicExchange(USER_UPDATE_EXCHANGE);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
