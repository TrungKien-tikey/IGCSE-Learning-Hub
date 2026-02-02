package com.igcse.course.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "igcse.payment.exchange";
    public static final String ENROLLMENT_QUEUE = "course.enrollment.queue";
    public static final String ENROLLMENT_ROUTING_KEY = "course.enrollment";

    @Bean
    public TopicExchange paymentExchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Queue enrollmentQueue() {
        return new Queue(ENROLLMENT_QUEUE);
    }

    @Bean
    public Binding enrollmentBinding(Queue enrollmentQueue, TopicExchange paymentExchange) {
        return BindingBuilder.bind(enrollmentQueue).to(paymentExchange).with(ENROLLMENT_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
