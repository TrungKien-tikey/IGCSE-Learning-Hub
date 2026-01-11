package com.igcse.ai.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String EXCHANGE_NAME = "exam.grading.exchange";
    public static final String QUEUE_NAME = "exam.grading.queue";
    public static final String ROUTING_KEY = "grade.exam";

    public static final String RESULT_EXCHANGE_NAME = "exam.grading.result.exchange";
    public static final String RESULT_QUEUE_NAME = "exam.grading.result.queue";
    public static final String RESULT_ROUTING_KEY = "grade.result";

    @Bean
    public DirectExchange gradingExchange() {
        return new DirectExchange(EXCHANGE_NAME);
    }

    @Bean
    public Queue gradingQueue() {
        return new Queue(QUEUE_NAME, true);
    }

    @Bean
    public Binding binding(Queue gradingQueue, DirectExchange gradingExchange) {
        return BindingBuilder.bind(gradingQueue).to(gradingExchange).with(ROUTING_KEY);
    }

    @Bean
    public DirectExchange resultExchange() {
        return new DirectExchange(RESULT_EXCHANGE_NAME);
    }

    @Bean
    public Queue resultQueue() {
        return new Queue(RESULT_QUEUE_NAME, true);
    }

    @Bean
    public Binding resultBinding(Queue resultQueue, DirectExchange resultExchange) {
        return BindingBuilder.bind(resultQueue).to(resultExchange).with(RESULT_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        DefaultJackson2JavaTypeMapper typeMapper = new DefaultJackson2JavaTypeMapper();

        // QUAN TRỌNG: Cho phép Jackson tự suy luận Type từ tham số của hàm
        // @RabbitListener
        // Bất kể message đến từ package nào (__TypeId__ header)
        typeMapper.setTypePrecedence(DefaultJackson2JavaTypeMapper.TypePrecedence.INFERRED);
        typeMapper.addTrustedPackages("*");

        converter.setJavaTypeMapper(typeMapper);
        return converter;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jsonMessageConverter());

        // QUAN TRỌNG: Ngừng việc đẩy lại message lỗi vào hàng đợi (Poison Pill Fix)
        // Message lỗi sẽ bị discard hoặc đưa vào DLQ thay vì lặp vô hạn
        factory.setDefaultRequeueRejected(false);

        return factory;
    }
}
