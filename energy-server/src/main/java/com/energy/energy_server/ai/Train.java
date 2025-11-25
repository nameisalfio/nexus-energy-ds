package com.energy.energy_server.ai;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.ArrayList;
import java.util.List;

import org.deeplearning4j.nn.multilayer.MultiLayerNetwork;
import org.deeplearning4j.optimize.listeners.ScoreIterationListener;
import org.deeplearning4j.util.ModelSerializer;
import org.nd4j.linalg.api.ndarray.INDArray;
import org.nd4j.linalg.dataset.DataSet;
import org.nd4j.linalg.dataset.api.preprocessor.NormalizerMinMaxScaler;
import org.nd4j.linalg.dataset.api.preprocessor.serializer.NormalizerSerializer;
import org.nd4j.linalg.factory.Nd4j;

public class Train {

    public static void main(String[] args) throws Exception {
        // 1. READ CSV
        File csvFile = new File(ModelConfig.CSV_PATH);
        if (!csvFile.exists()) throw new RuntimeException("CSV not found: " + csvFile.getAbsolutePath());

        List<double[]> rawData = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(csvFile))) {
            String line;
            br.readLine(); // Skip header
            while ((line = br.readLine()) != null) {
                String[] parts = line.split(",");
                double temp = Double.parseDouble(parts[1]);
                double hum = Double.parseDouble(parts[2]);
                double occ = Double.parseDouble(parts[4]);
                double cons = Double.parseDouble(parts[10]);
                rawData.add(new double[]{temp, hum, occ, cons});
            }
        }
        System.out.println("Data loaded: " + rawData.size());

        // 2. PREPARE TENSORS (Sliding Window + Masking)
        int timeSteps = ModelConfig.TIME_STEPS;
        int numSamples = rawData.size() - timeSteps; 
        int numFeatures = ModelConfig.INPUT_FEATURES;

        INDArray features = Nd4j.create(new int[]{numSamples, numFeatures, timeSteps});
        INDArray labels = Nd4j.create(new int[]{numSamples, 1, timeSteps});
        INDArray labelMask = Nd4j.create(new int[]{numSamples, timeSteps});

        for (int i = 0; i < numSamples; i++) {
            for (int t = 0; t < timeSteps; t++) {
                double[] row = rawData.get(i + t);
                features.putScalar(new int[]{i, 0, t}, row[0]); 
                features.putScalar(new int[]{i, 1, t}, row[1]); 
                features.putScalar(new int[]{i, 2, t}, row[2]); 
                features.putScalar(new int[]{i, 3, t}, row[3]); 
            }
            // Target: last step
            double target = rawData.get(i + timeSteps)[3];
            labels.putScalar(new int[]{i, 0, timeSteps - 1}, target);
            labelMask.putScalar(new int[]{i, timeSteps - 1}, 1.0);
        }

        DataSet allData = new DataSet(features, labels, null, labelMask);

        // 3. NORMALIZATION
        System.out.println("Normalization...");
        NormalizerMinMaxScaler normalizer = new NormalizerMinMaxScaler(0, 1);
        normalizer.fitLabel(true); // Normalize the target as well to help convergence
        normalizer.fit(allData); 
        normalizer.transform(allData);
        
        // 4. NETWORK CONFIGURATION
        System.out.println("Configuring Network...");
        MultiLayerNetwork model = new MultiLayerNetwork(LstmArchitecture.build());
        model.init();
        model.setListeners(new ScoreIterationListener(100)); 

        // 5. TRAINING LOOP 
        System.out.println("Starting Training (" + ModelConfig.EPOCHS + " epochs)...");
        
        for (int i = 0; i < ModelConfig.EPOCHS; i++) {
            model.fit(allData);
            System.out.println("Epoch " + (i+1) + " | MSELoss value: " + model.score());
        }

        // 6. SAVING
        System.out.println("Saving...");
        File modelFile = new File(ModelConfig.MODEL_EXPORT_PATH);
        File normFile = new File(ModelConfig.NORMALIZER_EXPORT_PATH);
        
        if (modelFile.getParentFile() != null) modelFile.getParentFile().mkdirs();

        ModelSerializer.writeModel(model, modelFile, true);
        NormalizerSerializer.getDefault().write(normalizer, normFile);

        System.out.println("=== Training Complete ===");
    }
}