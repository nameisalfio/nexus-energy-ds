package com.energy.energy_server.service.components;

import com.energy.energy_server.config.RabbitMQConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Debug consumer for DLQ: logs when messages arrive to trace why they exceeded delivery limit.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class DlqDebugConsumer {

    private final ObjectMapper objectMapper;

    @RabbitListener(queues = RabbitMQConfig.DLQ_NAME, concurrency = "1")
    public void onDlqMessage(Message rawMessage,
                             @Header(AmqpHeaders.MESSAGE_ID) String messageId) {
        Map<String, Object> headers = rawMessage.getMessageProperties().getHeaders();

        Object deliveryCount = headers.get("x-delivery-count");
        Object firstDeathReason = headers.get("x-first-death-reason");
        Object firstDeathQueue = headers.get("x-first-death-queue");
        Object death = headers.get("x-death");

        String bodyPreview = "";
        try {
            JsonNode node = objectMapper.readTree(rawMessage.getBody());
            bodyPreview = node.has("correlationId") ? node.get("correlationId").asText() : "no-correlationId";
        } catch (Exception ignored) {
        }

        log.error("🔴 DLQ_ARRIVED | ID: {} | correlationId: {} | x-delivery-count: {} | x-first-death-reason: {} | x-first-death-queue: {} | x-death: {}",
                messageId,
                bodyPreview,
                deliveryCount,
                firstDeathReason,
                firstDeathQueue,
                death);
    }
}