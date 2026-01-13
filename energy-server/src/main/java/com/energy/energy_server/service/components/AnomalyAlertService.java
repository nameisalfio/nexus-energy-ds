package com.energy.energy_server.service.components;

import com.energy.energy_server.config.RabbitMQConfig;
import com.energy.energy_server.dto.event.AnomalyEvent;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AnomalyAlertService {

    @RabbitListener(queues = RabbitMQConfig.ANOMALY_QUEUE)
    public void handleAnomaly(AnomalyEvent anomalyEvent) {

        try {
            MDC.put("event_type", "ANOMALY");
            MDC.put("anomaly_deviation", String.format("%.2f", anomalyEvent.getDeviationPercent()));
            MDC.put("anomaly_actual", String.format("%.2f", anomalyEvent.getActualValue()));
            MDC.put("anomaly_predicted", String.format("%.2f", anomalyEvent.getPredictedValue()));

            log.warn("ANOMALY_ALERT: Deviation of {}% detected at {}. Predicted: {}, Actual: {}",
                    String.format("%.2f", anomalyEvent.getDeviationPercent()),
                    anomalyEvent.getTimestamp(),
                    String.format("%.2f", anomalyEvent.getPredictedValue()),
                    String.format("%.2f", anomalyEvent.getActualValue()));
        } finally {
            MDC.clear();
        }
    }
}
