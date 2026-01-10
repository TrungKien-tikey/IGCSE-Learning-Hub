package com.igcse.auth.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

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

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
