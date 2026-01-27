package com.energy.energy_server.service.components;

import org.springframework.web.multipart.MultipartFile;

public interface IngestionService {

    void handleUpload(MultipartFile file) throws Exception;

}