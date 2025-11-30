package com.energy.energy_server.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import com.energy.energy_server.service.EnergyAnalysisService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api") 
@RequiredArgsConstructor
public class EnergyFacadeController {

    private final EnergyAnalysisService analysisService;

    @GetMapping("/full-report")
    public ResponseEntity<SystemReportDTO> getSystemReport() {
        return ResponseEntity.ok(analysisService.generateFullReport());
    }

    @PostMapping(value = "/ingest-dataset", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> ingestDataset(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) return ResponseEntity.badRequest().body("File is empty.");
        try {
            analysisService.ingestCsvData(file);
            return ResponseEntity.status(HttpStatus.CREATED).body("Dataset received. Simulation started automatically.");
        } catch (Exception e) {
            log.error("Error during ingestion: ", e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/stats/weekly")
    public ResponseEntity<List<WeeklyStatsDTO>> getWeeklyStats() {
        return ResponseEntity.ok(analysisService.getWeeklyStats());
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE) 
    public SseEmitter streamData() {
        log.info("New client subscribed to SSE stream.");
        return analysisService.subscribe();
    }

    @PostMapping("/simulation/start") 
    public ResponseEntity<String> startSimulation() {
        analysisService.startSimulation();
        return ResponseEntity.ok("Simulation Started");
    }

    @PostMapping("/simulation/stop") 
    public ResponseEntity<String> stopSimulation() {
        analysisService.stopSimulation();
        return ResponseEntity.ok("Simulation Stopped");
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("PONG");
    }

}