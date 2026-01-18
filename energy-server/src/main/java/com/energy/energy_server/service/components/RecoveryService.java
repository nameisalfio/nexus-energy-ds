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

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME, concurrency = "1") // Concurrency per evitare race conditions
    public void recoverData(
            EnergyReading energyReading,
            @Header(AmqpHeaders.MESSAGE_ID) String messageId) {

        log.info("🔄 RECOVERY START | ID: {} | Source: RabbitMQ", messageId);

        // Validazione ID
        if (messageId == null) {
            log.error("❌ RECOVERY REJECTED | Reason: Missing ID | Action: Skipped");
            return;
        }

        try {
            // Controllo duplicati
            if (energyRepository.existsByCorrelationId(messageId)) {
                log.warn("⏭️  RECOVERY_SKIP | ID: {} | Reason: Duplicate already in DB", messageId);
                return;
            }

            // Salvataggio
            energyReading.setCorrelationId(messageId);
            energyRepository.save(energyReading);

            auditService.incrementReceived(); // Incremento ricezione Rabbit
            auditService.logStatus(); // Stampa riepilogo ogni volta che recupera

            log.info("✅ RECOVERY_SUCCESS | ID: {} | Timestamp: {} | Temp: {}°C | Humidity: {}% | Energy: {} kWh | Action: Saved to DB",
                    messageId,
                    energyReading.getTimestamp(),
                    energyReading.getTemperature(),
                    energyReading.getHumidity(),
                    energyReading.getEnergyConsumption());

        } catch (CannotGetJdbcConnectionException e) {
            // DB irraggiungibile
            log.error("🔴 RECOVERY_FAILED | ID: {} | Reason: DB_UNREACHABLE | Action: Requeued", messageId);
            throw e;

        } catch (QueryTimeoutException e) {
            // Query troppo lenta
            log.error("🔴 RECOVERY_FAILED | ID: {} | Reason: DB_TIMEOUT | Action: Requeued", messageId);
            throw e;

        } catch (JDBCConnectionException e) {
            log.error("🔴 RECOVERY_FAILED | ID: {} | Reason: JDBC_CONNECTION | Action: Requeued", messageId);
            throw e;

        } catch (DataAccessException e) {
            // Altri errori DB
            log.error("🔴 RECOVERY_FAILED | ID: {} | Reason: DB_ERROR | Error: {} | Action: Requeued",
                    messageId, e.getClass().getSimpleName());
            throw e;

        }

//        catch (UnknownHostException e) {
//            log.error("🔴 RECOVERY_FAILED | ID: {} | Reason: UNKNOWN_HOST | Action: Requeued", messageId);
//            throw e;
//
//        }
        catch (Exception e) {
            // Altre eccezioni - Log più dettagliato
            log.error("❌ RECOVERY_ERROR | ID: {} | Reason: {} | Message: {} | Action: Message requeued",
                    messageId,
                    e.getClass().getSimpleName(),
                    e.getMessage());

            // Rilancia per requeue
            throw e;
        }
    }
}