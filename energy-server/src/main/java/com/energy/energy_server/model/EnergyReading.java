package com.energy.energy_server.model;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name = "energy_readings")
@NoArgsConstructor
@AllArgsConstructor
public class EnergyReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String correlationId;

    private LocalDateTime timestamp;
    private Double temperature;
    private Double humidity;
    private Double squareFootage;
    private Integer occupancy;
    private String hvacUsage; 
    private String lightingUsage;
    private Double renewableEnergy;
    private String dayOfWeek;
    private String holiday;
    private Double energyConsumption;
}