package com.igcse.user.config;

import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String USER_SYNC_QUEUE = "user.sync.queue";

    @Bean
    public org.springframework.amqp.core.Queue userSyncQueue() {
        return new org.springframework.amqp.core.Queue(USER_SYNC_QUEUE);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
