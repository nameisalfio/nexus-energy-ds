package com.energy.energy_server.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.MessageConversionException;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Slf4j
@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "energy_exchange";
    public static final String QUEUE_NAME = "energy_fallback_queue";
    public static final String ROUTING_KEY = "energy.reading.save";
    public static final String DLQ_NAME = QUEUE_NAME + ".dlq";

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    @Bean
    public Queue fallbackQueue() {
        return QueueBuilder.durable(QUEUE_NAME)
                .withArgument("x-queue-type", "quorum")
                // TTL 7 days = 604800000ms
                .withArgument("x-message-ttl", 604800000)
                .withArgument("x-dead-letter-exchange", "")
                .withArgument("x-dead-letter-routing-key", DLQ_NAME)
                // Delivery limit -> DLQ
                .withArgument("x-delivery-limit", 1000)
                .build();
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(DLQ_NAME)
                .withArgument("x-queue-type", "quorum")
                .build();
    }

    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }

    @Bean
    public Binding binding(Queue fallbackQueue, TopicExchange exchange) {
        return BindingBuilder.bind(fallbackQueue).to(exchange).with(ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        return new MessageConverter() {

            @Override
            @NonNull
            public Message toMessage(@NonNull Object object, @NonNull MessageProperties messageProperties)
                    throws MessageConversionException {
                try {
                    byte[] bytes = objectMapper.writeValueAsBytes(object);

                    messageProperties.setContentType(MessageProperties.CONTENT_TYPE_JSON);
                    messageProperties.setContentEncoding(StandardCharsets.UTF_8.name());
                    messageProperties.setContentLength(bytes.length);
                    messageProperties.setHeader("__TypeId__", object.getClass().getName());

                    return new Message(bytes, messageProperties);
                } catch (IOException e) {
                    throw new MessageConversionException("Failed to convert object to JSON message", e);
                }
            }

            @Override
            @NonNull
            public Object fromMessage(@NonNull Message message) throws MessageConversionException {
                try {
                    String typeId = message.getMessageProperties().getHeader("__TypeId__");
                    if (typeId == null) {
                        return objectMapper.readTree(message.getBody());
                    }

                    if (!typeId.startsWith("com.energy.energy_server")) {
                        throw new MessageConversionException("Insecure type detected: " + typeId);
                    }

                    Class<?> targetClass = Class.forName(typeId);
                    return objectMapper.readValue(message.getBody(), targetClass);
                } catch (ClassNotFoundException | IOException e) {
                    throw new MessageConversionException("Failed to convert JSON to object", e);
                }
            }
        };
    }

    @Bean
    public RabbitTemplate rabbitTemplate(
            ConnectionFactory connectionFactory,
            MessageConverter jsonMessageConverter) {

        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);

        template.setConfirmCallback((correlationData, ack, cause) -> {
            if (ack) {
                log.debug("Message confirmed by RabbitMQ: {}", correlationData);
            } else {
                log.error("CRITICAL: Message rejected by RabbitMQ! CorrelationData: {}, Cause: {}",
                        correlationData, cause);
            }
        });

        template.setReturnsCallback(returned -> {
            log.error("CRITICAL: Message returned (unroutable)! " +
                            "Exchange: {}, RoutingKey: {}, ReplyText: {}, Message: {}",
                    returned.getExchange(),
                    returned.getRoutingKey(),
                    returned.getReplyText(),
                    returned.getMessage());
        });

        return template;
    }
}