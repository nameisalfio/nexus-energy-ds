package com.energy.energy_server.service;

import java.io.File;
import java.util.List;

import org.deeplearning4j.nn.multilayer.MultiLayerNetwork;
import org.deeplearning4j.util.ModelSerializer;
import org.nd4j.linalg.api.ndarray.INDArray;
import org.nd4j.linalg.dataset.api.preprocessor.DataNormalization;
import org.nd4j.linalg.dataset.api.preprocessor.serializer.NormalizerSerializer;
import org.nd4j.linalg.factory.Nd4j;
import org.springframework.stereotype.Service;

import com.energy.energy_server.ai.ModelConfig;
import com.energy.energy_server.model.EnergyReading;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AiModelService {

    private MultiLayerNetwork model;
    private DataNormalization normalizer;

    @PostConstruct
    public void init() {
        try {
            // Load Model
            File modelFile = new File(ModelConfig.MODEL_EXPORT_PATH);
            if (modelFile.exists()) {
                model = ModelSerializer.restoreMultiLayerNetwork(modelFile);
                log.info("✅ AI Model loaded successfully from: {}", modelFile.getAbsolutePath());
            } else {
                log.error("❌ Model file not found at {}. Did you run Train.java?", modelFile.getAbsolutePath());
            }

            // Load Normalizer
            File normFile = new File(ModelConfig.NORMALIZER_EXPORT_PATH);
            if (normFile.exists()) {
                normalizer = NormalizerSerializer.getDefault().restore(normFile);
                log.info("✅ Normalizer loaded successfully.");
            } else {
                log.error("❌ Normalizer file not found!");
            }

        } catch (Exception e) {
            log.error("🔥 Critical Error loading AI components", e);
        }
    }

    public double predictNextHour(List<EnergyReading> history) {
        if (model == null || normalizer == null) {
            // log.warn("AI not ready."); // Uncomment for debug
            return 0.0;
        }

        int timeSteps = ModelConfig.TIME_STEPS; // 24
        if (history.size() < timeSteps) {
            return 0.0;
        }

        try {
            // Create 3D Input Tensor: [1 sample, 4 features, 24 steps]
            INDArray input = Nd4j.create(new int[]{1, ModelConfig.INPUT_FEATURES, timeSteps});

            for (int t = 0; t < timeSteps; t++) {
                // Reverse order mapping: 0 (Network Input Start) -> 23 (Oldest History Item)
                EnergyReading r = history.get(timeSteps - 1 - t);

                // --- SAFE UNBOXING FIX ---
                // Prevent NullPointerException if DB has missing values
                double temp = r.getTemperature() != null ? r.getTemperature() : 0.0;
                double hum = r.getHumidity() != null ? r.getHumidity() : 0.0;
                double occ = r.getOccupancy() != null ? r.getOccupancy() : 0.0;
                double cons = r.getEnergyConsumption() != null ? r.getEnergyConsumption() : 0.0;

                input.putScalar(new int[]{0, 0, t}, temp);
                input.putScalar(new int[]{0, 1, t}, hum);
                input.putScalar(new int[]{0, 2, t}, occ);
                input.putScalar(new int[]{0, 3, t}, cons);
            }

            // Normalize & Predict
            normalizer.transform(input);
            INDArray output = model.output(input);
            normalizer.revertLabels(output);

            double prediction = output.getDouble(0, 0, timeSteps - 1);
            return Math.max(0.0, prediction);

        } catch (Exception e) {
            log.error("AI Prediction failed", e);
            return -1.0;
        }
    }
}