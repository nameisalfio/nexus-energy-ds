package com.energy.energy_server.service;

import java.io.File;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.deeplearning4j.nn.multilayer.MultiLayerNetwork;
import org.deeplearning4j.util.ModelSerializer;
import org.nd4j.linalg.api.ndarray.INDArray;
import org.nd4j.linalg.dataset.api.preprocessor.NormalizerStandardize;
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

    // Based on our 3.91 kWh MAE. 
    // We consider an anomaly if deviation > 2.5 * MAE (approx. 99% confidence)
    private static final double DYNAMIC_MAE_THRESHOLD = 3.91 * 2.5; 
    
    private static final String MSG_ANOMALY = "Anomaly detected: consumption deviates significantly from the expected pattern.";
    private static final String MSG_NORMAL = "System operating within normal parameters.";

    private final EnergyReadingRepository energyReadingRepository;
    private MultiLayerNetwork model;
    private NormalizerStandardize normalizer;

    @PostConstruct
    public void init() {
        try {
            File modelFile = new File(ModelConfig.MODEL_EXPORT_PATH);
            File normFile = new File(ModelConfig.NORMALIZER_EXPORT_PATH);

            if (modelFile.exists() && normFile.exists()) {
                model = ModelSerializer.restoreMultiLayerNetwork(modelFile);
                normalizer = NormalizerSerializer.getDefault().restore(normFile);
                log.info("Digital Twin AI Engine initialized with MAE-base: 3.91 kWh");
            } else {
                log.warn("AI Assets missing. Models must be trained before inference is available.");
            }
        } catch (Exception e) {
            log.error("Failed to initialize AI Service", e);
        }
    }

    public AiInsightDTO analyze(EnergyReading reading) {
        // Retrieve enough history for the 12-hour window
        List<EnergyReading> history = energyReadingRepository.findTop100ByOrderByTimestampDesc();
        
        double predicted = predictNextHour(history);
        double actual = reading.getEnergyConsumption() != null ? reading.getEnergyConsumption() : 0.0;
        
        // Dynamic Threshold Logic: Using absolute error instead of percentage
        double absoluteDeviation = actual - predicted;
        boolean isAnomaly = Math.abs(absoluteDeviation) > DYNAMIC_MAE_THRESHOLD;
        
        // Use the messages
        String statusMessage = isAnomaly ? MSG_ANOMALY : MSG_NORMAL;
        String smartSuggestion = generateSmartSuggestion(reading, actual, predicted, absoluteDeviation);
        
        // Combine status and suggestion
        String finalOutput = statusMessage + " " + smartSuggestion;

        return new AiInsightDTO(
            isAnomaly,
            predicted,
            actual,
            absoluteDeviation,
            finalOutput
        );
    }

    public double predictNextHour(List<EnergyReading> history) {
        if (model == null || normalizer == null || history.size() < ModelConfig.TIME_STEPS) {
            return 0.0;
        }

        try {
            int steps = ModelConfig.TIME_STEPS;
            // IMPORTANT: Shape must match [1, 6, 12] as per our "Gold" model
            INDArray input = Nd4j.create(new int[]{1, ModelConfig.INPUT_FEATURES, steps}, 'c');

            for (int t = 0; t < steps; t++) {
                // history is DESC (0 is most recent). Map t=0 to oldest in window.
                EnergyReading r = history.get(steps - 1 - t);
                
                // Feature Engineering (Synchronized with Train.java)
                double temp = r.getTemperature() != null ? r.getTemperature() : 0.0;
                double occ = r.getOccupancy() != null ? r.getOccupancy() : 0.0;
                double hvac = "ON".equalsIgnoreCase(r.getHvacUsage()) ? 1.0 : 0.0;
                
                // Lag1h (Consumption of previous record)
                double lag = 0.0;
                if ((steps - 1 - t + 1) < history.size()) {
                    lag = history.get(steps - t).getEnergyConsumption();
                }

                // Time Cyclical Features
                LocalDateTime ldt = r.getTimestamp().atZone(ZoneId.systemDefault()).toLocalDateTime();
                int hour = ldt.getHour();
                double hSin = Math.sin(2 * Math.PI * hour / 24.0);
                double hCos = Math.cos(2 * Math.PI * hour / 24.0);

                input.putScalar(new int[]{0, 0, t}, temp);
                input.putScalar(new int[]{0, 1, t}, occ);
                input.putScalar(new int[]{0, 2, t}, hvac);
                input.putScalar(new int[]{0, 3, t}, lag);
                input.putScalar(new int[]{0, 4, t}, hSin);
                input.putScalar(new int[]{0, 5, t}, hCos);
            }

            normalizer.transform(input);
            INDArray output = model.output(input);
            
            // Revert labels manually (output is [1, 1, 12])
            double normPred = output.getDouble(0, 0, steps - 1);
            double mean = normalizer.getLabelMean().getDouble(0);
            double std = normalizer.getLabelStd().getDouble(0);
            
            return Math.max(0.0, (normPred * std) + mean);

        } catch (Exception e) {
            log.error("Inference Error", e);
            return 0.0;
        }
    }

    private String generateSmartSuggestion(EnergyReading r, double actual, double predicted, double dev) {
        if (dev > DYNAMIC_MAE_THRESHOLD && r.getOccupancy() < 5) {
            return "Critical: High energy drain in an empty building. Potential HVAC override or lighting failure.";
        }
        if (r.getRenewableEnergy() > 50 && actual > predicted) {
            return "Generation Surplus: Utilizing extra renewable power for current demand.";
        }
        return "Performance aligns with Digital Twin baseline.";
    }
}