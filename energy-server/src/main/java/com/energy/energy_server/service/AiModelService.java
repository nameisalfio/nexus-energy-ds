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

    /**
     * On server startup, load the neural network (Zip) and the normalizer (Bin)
     * that you created with Train.java
     */
    @PostConstruct
    public void init() {
        try {
            // 1. Load the Neural Network
            File modelFile = new File(ModelConfig.MODEL_EXPORT_PATH);
            if (modelFile.exists()) {
                model = ModelSerializer.restoreMultiLayerNetwork(modelFile);
                log.info("AI Model loaded successfully from: {}", modelFile.getAbsolutePath());
            } else {
                log.error("Model file not found at {}.", modelFile.getAbsolutePath());
            }

            // 2. Load the Normalizer (Essential for scaling data to 0-1)
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

    /**
     * Fetches the latest data from the database and predicts the next value.
     */
    public double predictNextHour(List<EnergyReading> history) {
        // If the model is not loaded, return 0 or a fallback value
        if (model == null || normalizer == null) {
            log.warn("AI not ready (Model or Normalizer missing).");
            return 0.0;
        }

        int timeSteps = ModelConfig.TIME_STEPS; // 24 hours
        if (history.size() < timeSteps) {
            log.info("Not enough data for prediction yet (Need {}, Got {}).", timeSteps, history.size());
            return 0.0;
        }

        try {
            // 1. Create input tensor
            INDArray input = Nd4j.create(new int[]{1, ModelConfig.INPUT_FEATURES, ModelConfig.TIME_STEPS});
            for (int t = 0; t < ModelConfig.TIME_STEPS; t++) {
                EnergyReading r = history.get(ModelConfig.TIME_STEPS - 1 - t);
                input.putScalar(new int[]{0, 0, t}, r.getTemperature());
                input.putScalar(new int[]{0, 1, t}, r.getHumidity());
                input.putScalar(new int[]{0, 2, t}, r.getOccupancy());
                input.putScalar(new int[]{0, 3, t}, r.getEnergyConsumption());
            }

            // 2. NORMALIZE INPUT (Scale to 0-1)
            normalizer.transform(input);

            // 3. INFERENCE
            INDArray output = model.output(input); // Outputs a number in [0, 1]

            // 4. DENORMALIZE OUTPUT (Convert back to real kWh)
            normalizer.revertLabels(output); 

            double prediction = output.getDouble(0, 0, ModelConfig.TIME_STEPS - 1); // Predicted number (a real value)

            return Math.max(0.0, prediction);

        } catch (Exception e) {
            log.error("Prediction error", e);
            return -1.0;
        }
    }
}