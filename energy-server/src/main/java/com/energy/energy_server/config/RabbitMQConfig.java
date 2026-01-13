package com.energy.energy_server.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.MessageConversionException;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.jspecify.annotations.NonNull;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "energy_exchange";

    // Code
    public static final String QUEUE_NAME = "energy_fallback_queue";
    public static final String ROUTING_KEY = "energy.reading.save";
    public static final String ANOMALY_QUEUE = "energy_anomaly_queue";
    public static final String ANOMALY_ROUTING_KEY = "energy.anomaly.#";

    // --- 1. DEFINIZIONE OBJECT MAPPER (LA SOLUZIONE ALL'ERRORE) ---

    @Bean
    @Primary // Dice a Spring: "Usa questo come principale se ne trovi altri"
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        // Modulo fondamentale per convertire LocalDateTime correttamente
        mapper.registerModule(new JavaTimeModule());
        // Disabilita la conversione delle date in array numerici [2026, 1, 1...]
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    // --- 2. CODE & EXCHANGE ---

    @Bean
    public Queue fallbackQueue() {
        return QueueBuilder.durable(QUEUE_NAME)
                .withArgument("x-queue-type", "quorum")
                .withArgument("x-message-ttl", 86400000)
                .withArgument("x-max-length", 100000)
                .withArgument("x-overflow", "reject-publish")
                .build();
    }

    @Bean
    public Queue anomalyQueue() {
        return QueueBuilder.durable(ANOMALY_QUEUE)
                .withArgument("x-queue-type", "quorum")
                .build();
    }

    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    // --- 3. BINDINGS ---

    @Bean
    public Binding binding(Queue fallbackQueue, TopicExchange exchange) {
        return BindingBuilder.bind(fallbackQueue).to(exchange).with(ROUTING_KEY);
    }

    @Bean
    public Binding anomalyBinding(Queue anomalyQueue, TopicExchange exchange) {
        return BindingBuilder.bind(anomalyQueue).to(exchange).with(ANOMALY_ROUTING_KEY);
    }

    // --- 4. CONVERTER CUSTOM ---

    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        return new MessageConverter() {

            @Override
            @NonNull
            public Message toMessage(@NonNull Object object, @NonNull MessageProperties messageProperties) throws MessageConversionException {
                try {
                    byte[] bytes = objectMapper.writeValueAsBytes(object);

                    messageProperties.setContentType(MessageProperties.CONTENT_TYPE_JSON);
                    messageProperties.setContentEncoding(StandardCharsets.UTF_8.name());
                    messageProperties.setContentLength(bytes.length);

                    // Imposta TypeID per il destinatario
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

                    if (typeId != null) {
                        Class<?> targetClass = Class.forName(typeId);
                        return objectMapper.readValue(message.getBody(), targetClass);
                    } else {
                        return objectMapper.readTree(message.getBody());
                    }
                } catch (ClassNotFoundException | IOException e) {
                    throw new MessageConversionException("Failed to convert JSON message to object", e);
                }
            }
        };
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}