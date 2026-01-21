package com.energy.energy_server.service.components;

import com.energy.energy_server.config.RabbitMQConfig;
import com.energy.energy_server.model.EnergyReading;
import com.energy.energy_server.repository.EnergyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.exception.JDBCConnectionException;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.QueryTimeoutException;
import org.springframework.jdbc.CannotGetJdbcConnectionException;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Service;

import java.net.UnknownHostException;

/**
 * VERSIONE MINIMA CHE COMPILA SICURO
 * Usa questa se hai problemi di compilazione
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class RecoveryService {

    private final EnergyRepository energyRepository;

    private final AuditService auditService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME, concurrency = "5-10")
    // Concurrency handling to avoid race conditions
    public void recoverData(
            EnergyReading energyReading,
            @Header(AmqpHeaders.MESSAGE_ID) String messageId) {

        log.info("🔄 RECOVERY START | ID: {} | Source: RabbitMQ", messageId);

        // ID validation
        if (messageId == null) {
            log.error("❌ RECOVERY REJECTED | Reason: Missing ID | Action: Skipped");
            return;
        }

        try {
            // Check duplications
            if (energyRepository.existsByCorrelationId(messageId)) {
                log.warn("⏭️  RECOVERY_SKIP | ID: {} | Reason: Duplicate already in DB", messageId);
                return;
            }

            // Saving
            energyReading.setCorrelationId(messageId);
            energyRepository.save(energyReading);

            auditService.incrementReceived(); // Increment RabbitMQ reception counter
            auditService.logStatus(); // Log summary each time it is retrieved


            log.info("✅ RECOVERY_SUCCESS | ID: {} | Timestamp: {} | Temp: {}°C | Humidity: {}% | Energy: {} kWh | Action: Saved to DB",
                    messageId,
                    energyReading.getTimestamp(),
                    energyReading.getTemperature(),
                    energyReading.getHumidity(),
                    energyReading.getEnergyConsumption());

        } catch (CannotGetJdbcConnectionException e) {
            log.error("🔴 RECOVERY_FAILED | ID: {} | Reason: DB_UNREACHABLE | Action: Requeued", messageId);
            throw e;

        } catch (QueryTimeoutException e) {
            log.error("🔴 RECOVERY_FAILED | ID: {} | Reason: DB_TIMEOUT | Action: Requeued", messageId);
            throw e;

        } catch (JDBCConnectionException e) {
            log.error("🔴 RECOVERY_FAILED | ID: {} | Reason: JDBC_CONNECTION | Action: Requeued", messageId);
            throw e;

        } catch (DataAccessException e) {
            log.error("🔴 RECOVERY_FAILED | ID: {} | Reason: DB_ERROR | Error: {} | Action: Requeued",
                    messageId, e.getClass().getSimpleName());
            throw e;

        } catch (Exception e) {
            log.error("❌ RECOVERY_ERROR | ID: {} | Reason: {} | Message: {} | Action: Message requeued",
                    messageId,
                    e.getClass().getSimpleName(),
                    e.getMessage());

            throw e;
        }
    }
}