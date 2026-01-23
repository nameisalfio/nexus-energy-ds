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
import com.energy.energy_server.dto.AiInsightDTO;
import com.energy.energy_server.repository.EnergyReadingRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiModelService {

    private static final double ANOMALY_THRESHOLD = 0.2; // 20% allowed deviation
    private static final String MSG_ANOMALY = "Anomaly detected: consumption deviates from expected pattern.";
    private static final String MSG_NORMAL = "System operating within normal parameters.";

    private final EnergyReadingRepository energyReadingRepository;

    private MultiLayerNetwork model;
    private DataNormalization normalizer;

    @PostConstruct
    public void init() {
        try {
            // Load Model
            File modelFile = new File(ModelConfig.MODEL_EXPORT_PATH);
            if (modelFile.exists()) {
                model = ModelSerializer.restoreMultiLayerNetwork(modelFile);
                log.info("AI Model loaded successfully from: {}", modelFile.getAbsolutePath());
            } else {
                log.error("Model file not found at {}.", modelFile.getAbsolutePath());
            }

            // Load Normalizer
            File normFile = new File(ModelConfig.NORMALIZER_EXPORT_PATH);
            if (normFile.exists()) {
                normalizer = NormalizerSerializer.getDefault().restore(normFile);
                log.info("Normalizer loaded successfully.");
            } else {
                log.error("Normalizer file not found.");
            }
        } catch (Exception e) {
            log.error("Error loading AI components", e);
        }
    }

    public AiInsightDTO analyze(EnergyReading reading) {
        // Retrieve historical data sorted by timestamp (most recent first)
        List<EnergyReading> history = energyReadingRepository.findTop100ByOrderByTimestampDesc();

        // Limit the history to the required time steps for the model
        if (history.size() > ModelConfig.TIME_STEPS) {
            history = history.subList(0, ModelConfig.TIME_STEPS);
        }

        double predicted = predictNextHour(history);
        
        // Use the actual current value for comparison
        double actual = reading.getEnergyConsumption() != null ? reading.getEnergyConsumption() : 0.0;
        
        boolean anomaly = Math.abs(predicted - actual) > (predicted * ANOMALY_THRESHOLD); 
        double deviation = predicted > 0 ? ((actual - predicted) / predicted) * 100 : 0.0;

        return new AiInsightDTO(
            anomaly,
            predicted,
            actual,
            deviation,
            anomaly ? MSG_ANOMALY : MSG_NORMAL
        );
    }

    public double predictNextHour(List<EnergyReading> history) {
        if (model == null || normalizer == null || history.isEmpty()) return 0.0;
        
        // Fallback to the latest known value if history is insufficient
        if (history.size() < ModelConfig.TIME_STEPS) {
             return history.get(0).getEnergyConsumption() != null ? history.get(0).getEnergyConsumption() : 0.0;
        }

        try {
            int timeSteps = ModelConfig.TIME_STEPS;
            INDArray input = Nd4j.create(new int[]{1, ModelConfig.INPUT_FEATURES, timeSteps});

            for (int t = 0; t < timeSteps; t++) {
                // history is sorted DESC. We map it to the time steps expected by the model.
                // t=0 (start) -> oldest record
                // t=23 (end) -> most recent record
                EnergyReading r = history.get(timeSteps - 1 - t);
                
                double temp = r.getTemperature() != null ? r.getTemperature() : 0.0;
                double hum = r.getHumidity() != null ? r.getHumidity() : 0.0;
                double occ = r.getOccupancy() != null ? r.getOccupancy() : 0.0;
                double cons = r.getEnergyConsumption() != null ? r.getEnergyConsumption() : 0.0;

                input.putScalar(new int[]{0, 0, t}, temp);
                input.putScalar(new int[]{0, 1, t}, hum);
                input.putScalar(new int[]{0, 2, t}, occ);
                input.putScalar(new int[]{0, 3, t}, cons);
            }

            normalizer.transform(input);
            INDArray output = model.output(input);
            normalizer.revertLabels(output);

            return Math.max(0.0, output.getDouble(0, 0, timeSteps - 1));

        } catch (Exception e) {
            log.error("AI Prediction failed", e);
            return 0.0;
        }
    }
}