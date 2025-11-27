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

    /**
     * Endpoint to retrieve the full system report.
     * Combines stats, readings, and AI insights into a single response.
     *
     * @return ResponseEntity containing SystemReportDTO
     */
    @GetMapping("/full-report")
    public ResponseEntity<SystemReportDTO> getSystemReport() {
        log.info("Received request for full system report.");
        SystemReportDTO report = analysisService.generateFullReport();
        return ResponseEntity.ok(report);
    }

    /**
     * Endpoint to ingest a CSV dataset.
     * Accepts a multipart file upload and processes the CSV data.
     *
     * @param file MultipartFile representing the uploaded CSV
     * @return ResponseEntity with status message
     */
    @PostMapping(value = "/ingest-dataset", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> ingestDataset(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty.");
        }
        try {
            analysisService.ingestCsvData(file);
            return ResponseEntity.status(HttpStatus.CREATED).body("Dataset ingestion completed successfully.");
        } catch (Exception e) {
            log.error("Error during CSV ingestion: ", e);
            return ResponseEntity.internalServerError().body("Error processing file: " + e.getMessage());
        }
    }

    /**
     * Endpoint to retrieve weekly energy consumption statistics.
     *
     * @return ResponseEntity containing list of WeeklyStatsDTO
     */
    @GetMapping("/stats/weekly")
    public ResponseEntity<List<WeeklyStatsDTO>> getWeeklyStats() {
        return ResponseEntity.ok(analysisService.getWeeklyStats());
    }

    /**
     * Health check endpoint to verify server responsiveness.
     *
     * @return ResponseEntity with "PONG" message
     */
    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("PONG");
    }
}