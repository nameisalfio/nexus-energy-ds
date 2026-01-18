package com.energy.energy_server.service.components;

import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicInteger;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class AuditService {
    private final AtomicInteger csvTotal = new AtomicInteger(0);
    private final AtomicInteger rabbitSent = new AtomicInteger(0);
    private final AtomicInteger rabbitReceived = new AtomicInteger(0);
    private final AtomicInteger dbDirectSaved = new AtomicInteger(0);

    public void reset(int total) {
        csvTotal.set(total);
        rabbitSent.set(0);
        rabbitReceived.set(0);
        dbDirectSaved.set(0);
        log.info("📊 AUDIT RESET | Obiettivo: {} record", total);
    }

    public void incrementSent() {
        rabbitSent.incrementAndGet();
    }

    public void incrementReceived() {
        rabbitReceived.incrementAndGet();
    }

    public void incrementDirect() {
        dbDirectSaved.incrementAndGet();
    }

    public void logStatus() {
        log.info("📊 AUDIT STATUS | CSV: {} | Inviati Rabbit: {} | Ricevuti Rabbit: {} | Salvati Diretti: {} | TOTALE DB stimato: {}",
                csvTotal.get(), rabbitSent.get(), rabbitReceived.get(), dbDirectSaved.get(),
                (rabbitReceived.get() + dbDirectSaved.get()));
    }
}