package com.energy.energy_server.service.components;

import com.energy.energy_server.config.RabbitMQConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Uses RabbitMQ Management HTTP API to get total queue depth (ready + unacked).
 * AMQP {@code getMessageCount()} only returns ready messages; unacked messages
 * (delivered to consumers but not yet acknowledged) are excluded, which can
 * cause hasRecoveryBacklog() to return false when the queue actually has work.
 */
@Slf4j
@Service
public class RabbitMQQueueDepthService {

    private final RestClient restClient;
    private final String queueName;
    private final RabbitTemplate rabbitTemplate;
    private final boolean managementEnabled;
    private final String managementBaseUrl;

    public RabbitMQQueueDepthService(
            @Value("${spring.rabbitmq.host:localhost}") String host,
            @Value("${rabbitmq.management.port:15672}") int managementPort,
            @Value("${spring.rabbitmq.username:guest}") String username,
            @Value("${spring.rabbitmq.password:guest}") String password,
            @Value("${rabbitmq.management.enabled:true}") boolean managementEnabled,
            RabbitTemplate rabbitTemplate) {
        this.managementEnabled = managementEnabled;
        this.rabbitTemplate = rabbitTemplate;

        this.queueName = RabbitMQConfig.QUEUE_NAME;
        this.managementBaseUrl = "http://" + host + ":" + managementPort;

        String auth = Base64.getEncoder().encodeToString((username + ":" + password).getBytes(StandardCharsets.UTF_8));

        this.restClient = RestClient.builder()
                .baseUrl(managementBaseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + auth)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * Returns total messages in queue (ready + unacked).
     * Returns 0 on any error (caller treats as "no backlog").
     */
    public int getTotalMessageCount() {
        if (managementEnabled) {
            try {
                // Use list endpoint to avoid 404 on direct queue path (encoding issues with RestClient)
                URI listUri = URI.create(managementBaseUrl + "/api/queues/%2F");
                String json = restClient.get()
                        .uri(listUri)
                        .retrieve()
                        .body(String.class);

                if (json == null || json.isBlank()) {
                    return fallbackToAmqp();
                }

                JsonNode queues = new ObjectMapper().readTree(json);
                if (!queues.isArray()) {
                    return fallbackToAmqp();
                }

                for (JsonNode q : queues) {
                    if (queueName.equals(q.path("name").asText(null))) {
                        int messages = q.path("messages").asInt(0);
                        int ready = q.path("messages_ready").asInt(0);
                        int unacked = q.path("messages_unacknowledged").asInt(0);
                        int total = messages > 0 ? messages : (ready + unacked);
                        return Math.max(0, total);
                    }
                }
                return 0; // Queue not found in list
            } catch (Exception e) {
                log.warn("Management API unavailable, falling back to AMQP (ready only): {}", e.getMessage());
            }
        }
        return fallbackToAmqp();
    }

    /** AMQP getMessageCount() returns only ready messages; use when Management API is unavailable. */
    private int fallbackToAmqp() {
        try {
            Integer count = rabbitTemplate.execute(channel ->
                    channel.queueDeclarePassive(queueName).getMessageCount());
            return count != null ? Math.max(0, count) : 0;
        } catch (Exception e) {
            log.warn("Could not check queue depth via AMQP: {}", e.getMessage());
            return 0;
        }
    }
}
