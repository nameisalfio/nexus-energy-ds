package com.energy.energy_server.dto.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AnomalyEvent {

    private LocalDateTime timestamp;
    private double actualValue;
    private double predictedValue;
    private double deviationPercent;
    private String message;
    private Long readingId;

}
