package com.energy.energy_server.service.components;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.Queue;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import com.energy.energy_server.config.RabbitMQConfig;
import com.energy.energy_server.repository.UserRepository;
import org.slf4j.MDC;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.energy.energy_server.model.EnergyReading;
import com.energy.energy_server.repository.EnergyRepository;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class SimulationService {

    private final EnergyRepository energyRepository;
    private final UserRepository userRepository;
    private final RabbitTemplate rabbitTemplate;

    @Getter
    private final Queue<EnergyReading> ingestionQueue = new ConcurrentLinkedQueue<>();

    // --- CONTATORE ERRORI CONSECUTIVI ---
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);
    // Frequenza mail (es. ogni 50 errori)
    private static final int ALERT_THRESHOLD = 50;

    @Getter
    private final AtomicBoolean isRunning = new AtomicBoolean(false);

    public void loadQueue(java.util.List<EnergyReading> readings) {
        ingestionQueue.clear();
        ingestionQueue.addAll(readings);
    }

    public void stop() {
        isRunning.set(false);
    }

    // --- CIRCUIT BREAKER ---
    @CircuitBreaker(name = "energyDbBreaker", fallbackMethod = "fallbackSave")
    public void saveReading(EnergyReading entity) {

        // Imposta timestamp se null, utile per duplicazione
        if (entity.getTimestamp() == null) {
            entity.setTimestamp(LocalDateTime.now());
        }
        energyRepository.save(entity);

        if (consecutiveFailures.get() > 0) {
            log.info("DATABASE RECOVERED: Connection restored after {} failures.", consecutiveFailures.get());
            consecutiveFailures.set(0);
        }
    }

    // --- METODO DI FALLBACK ---
    public void fallbackSave(EnergyReading entity, Throwable t) {

        log.warn("DATABASE STRESS: Circuit Open! Skipping save for record. Error: {}", t.getMessage());

        // 1. Incrementa il contatore degli errori
        int currentFailures = consecutiveFailures.incrementAndGet();

        // 2. Logica recupero email utente (come visto prima)
        String userEmail = "admin@default.com";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            var userOpt = userRepository.findByUsername(auth.getName());

            if (userOpt.isPresent()) userEmail = userOpt.get().getEmail();
        }

        try {

            // 3. LOGICA DI ALERT INTELLIGENTE
            // Invia mail SOLO se è il 1° errore O se siamo a multipli della soglia (es. 50, 100, 150...)
            // Oppure usa (currentFailures == ALERT_THRESHOLD) per mandarla una volta sola al raggiungimento.

            if (currentFailures == 1 || currentFailures % ALERT_THRESHOLD == 0) {

                // --- QUESTA È LA CONDIZIONE PER LA MAIL ---
                MDC.put("alert_email", userEmail);
                log.warn("DATABASE STRESS: DB Down! Failures: {}. Redirecting to RabbitMQ. Error: {}", currentFailures, t.getMessage());

            } else {

                // --- LOG NORMALE (Niente "DATABASE STRESS", niente mail, ma visibile su Kibana) ---
                log.warn("DB Fallback active. Failure #{} for user {}", currentFailures, userEmail);
            }


            // Generazione id univoco per evitare duplicazione
            String uniqueId = (entity.getId() != null) ? entity.getId().toString() : UUID.randomUUID().toString();

            // 4. Invio a RabbitMQ (sempre)
            sendToRabbitMQ(entity); // (Estratto in metodo privato per pulizia)

        } finally {
            MDC.remove("alert_email");
        }
    }

    public long getRecordCount() {
        return energyRepository.count();
    }

    private void sendToRabbitMQ(EnergyReading entity) {
        try {
            // 1. Generazione ID Univoco per evitare duplicazione
            // Se l'entità ha già un ID (es. update) usiamo quello, altrimenti ne generiamo uno nuovo.
            // Questo servirà al Consumer per non salvare due volte lo stesso dato.
            String uniqueId = (entity.getId() != null) ? entity.getId().toString() : UUID.randomUUID().toString();

            // 2. Invio del messaggio
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    RabbitMQConfig.ROUTING_KEY,
                    entity,
                    message -> {
                        // 3. Arricchimento dei Metadati (Headers)
                        // Queste info viaggiano INSIEME al dato JSON, ma separate dal body.

                        // ID del messaggio (fondamentale per evitare duplicati)
                        message.getMessageProperties().setMessageId(uniqueId);

                        // Timestamp dell'evento originale
                        message.getMessageProperties().setTimestamp(new Date());

                        // Fonte dell'evento (utile per debugging: "chi ha mandato questo messaggio?")
                        message.getMessageProperties().setHeader("source", "circuit-breaker-fallback");

                        // Tipo di azione (utile se in futuro gestirai anche UPDATE o DELETE via coda)
                        message.getMessageProperties().setHeader("action", "SAVE");

                        // Content Type (aiuta il visualizzatore di RabbitMQ a capire che è JSON)
                        message.getMessageProperties().setContentType("application/json");

                        return message;
                    }
            );

            log.info("Backup success: Data sent to RabbitMQ with ID: {}", uniqueId);

        } catch (Exception e) {
            // 4. GESTIONE "DOUBLE FAULT" (Disastro Totale)
            // Se arriviamo qui, significa che SIA il Database SIA RabbitMQ sono giù.
            // È una situazione critica. L'unica salvezza è scrivere il dato grezzo nel file di log
            // sperando di poterlo recuperare a mano con uno script in futuro.

            log.error("CRITICAL DATA LOSS RISK: RabbitMQ unreachable during DB outage! Payload: {}", entity, e);
        }
    }
}