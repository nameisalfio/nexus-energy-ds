package com.energy.energy_server.service.components;

import com.energy.energy_server.config.RabbitMQConfig;
import com.energy.energy_server.model.EnergyReading;
import com.energy.energy_server.repository.EnergyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class RecoveryService {

    private final EnergyRepository energyRepository;

    // Ascolta coda RabbitMQ
    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void recoverData(EnergyReading energyReading, @Header(AmqpHeaders.MESSAGE_ID) String messageId) {

        log.info("RECOVERY: Processing message from RabbitMQ. ID: {}", messageId);

        try {
            // 1. Controllo duplicati, evitiamo salvataggi doppi
            if (energyReading.getId() != null && energyRepository.existsById(energyReading.getId())) {
                log.warn("RECOVERY: Duplicate detected, skipping. ID: {}", energyReading.getId());
                return;
            }

            // 2. Salvataggio su DB
            energyRepository.save(energyReading);

            // 3. ACK Automatico:
            // Se il metodo finisce senza errori, Spring dice a RabbitMQ "Tutto OK, cancella messaggio".

        } catch (Exception e) {
            log.error("RECOVERY FAILED: DB might be down still. Re-queueing message. Error: {}", e.getMessage());

            // Lanciare l'eccezione è FONDAMENTALE qui.
            // Dice a Spring: "Non ho finito, non cancellare il messaggio!".
            // Spring rimetterà il messaggio in coda e riproverà dopo qualche secondo.
            throw e;
        }
    }
}
