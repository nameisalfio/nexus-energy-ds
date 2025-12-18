package com.energy.energy_server.api;

import java.io.IOException;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.energy.energy_server.dto.SystemReportDTO;
import com.energy.energy_server.dto.WeeklyStatsDTO;
import com.energy.energy_server.service.EnergySystemFacade;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api") 
@RequiredArgsConstructor
public class EnergyController {

    private final EnergySystemFacade facade; 

    @PostMapping("/ingest-dataset")
    public ResponseEntity<?> ingestData(@RequestParam("file") MultipartFile file) {
        try {
            facade.handleDatasetUpload(file); 
            return ResponseEntity.ok("Data ingested successfully");
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/simulation/start")
    public void startSimulation() {
        facade.startSimulation();
    }

    @PostMapping("/simulation/stop")
    public void stopSimulation() {
        facade.stopSimulation();
    }

    @GetMapping("/full-report")
    public ResponseEntity<SystemReportDTO> getSystemReport() {
        return ResponseEntity.ok(facade.getCurrentStatus());
    }

    @GetMapping("/stats/weekly")
    public ResponseEntity<List<WeeklyStatsDTO>> getWeeklyStats() {
        return ResponseEntity.ok(facade.getWeeklyTrends());
    }

    @GetMapping("/stream")
    public SseEmitter stream() {
        return facade.subscribe();
    }
}