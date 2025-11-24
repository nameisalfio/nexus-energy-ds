package com.energy.energy_client.service;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import com.energy.energy_client.dto.SystemReportDTO;
import com.energy.energy_client.dto.WeeklyStatsDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnergyGatewayService {

    // Injected from application.properties
    @Value("${app.backend.url}")
    private String backendUrl;

    // The modern Spring HTTP Client
    private final RestClient.Builder restClientBuilder;

    /**
     * Calls the Backend to retrieve the full dashboard report.
     * REST Verb: GET
     */
    public SystemReportDTO getFullReport() {
        log.info("Calling Backend API: {}/full-report", backendUrl);

        return restClientBuilder.build()
                .get()
                .uri(backendUrl + "/full-report")
                .retrieve()
                .body(SystemReportDTO.class);
    }

    /**
     * Uploads a CSV file to the Backend.
     * REST Verb: POST (Multipart)
     */
    public String uploadCsvFile(MultipartFile file) throws IOException {
        log.info("Uploading file to Backend: {}", file.getOriginalFilename());

        // Prepare the multipart request body
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        });

        // Execute the POST request
        return restClientBuilder.build()
                .post()
                .uri(backendUrl + "/ingest-dataset")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(String.class);
    }

    /**
     * Retrieves weekly statistics from the Backend.
     * REST Verb: GET
     */
    public List<WeeklyStatsDTO> getWeeklyStats() {
    return restClientBuilder.build()
            .get()
            .uri(backendUrl + "/stats/weekly")
            .retrieve()
            .body(new ParameterizedTypeReference<List<WeeklyStatsDTO>>() {});
    }
}