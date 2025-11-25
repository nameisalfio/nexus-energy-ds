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

    @Value("${app.backend.url}")
    private String baseUrl; 

    private final RestClient.Builder restClientBuilder;

    // --- 1. FULL REPORT ---
    public SystemReportDTO getFullReport() {
        return restClientBuilder.build()
                .get()
                .uri(baseUrl + "/full-report")
                .retrieve()
                .body(SystemReportDTO.class);
    }

    // --- 2. UPLOAD CSV ---
    public String uploadCsvFile(MultipartFile file) throws IOException {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() { return file.getOriginalFilename(); }
        });

        return restClientBuilder.build()
                .post()
                .uri(baseUrl + "/ingest-dataset")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(String.class);
    }

    // --- 3. WEEKLY STATISTICS ---
    public List<WeeklyStatsDTO> getWeeklyStats() {
        return restClientBuilder.build()
                .get()
                .uri(baseUrl + "/stats/weekly")
                .retrieve()
                .body(new ParameterizedTypeReference<List<WeeklyStatsDTO>>() {});
    }

}