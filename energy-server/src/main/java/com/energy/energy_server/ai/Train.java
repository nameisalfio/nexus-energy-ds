package com.energy.energy_server.ai;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.ArrayList;
import java.util.List;

import org.deeplearning4j.nn.multilayer.MultiLayerNetwork;
import org.deeplearning4j.util.ModelSerializer;
import org.nd4j.linalg.api.ndarray.INDArray;
import org.nd4j.linalg.dataset.DataSet;
import org.deeplearning4j.datasets.iterator.ExistingDataSetIterator;
import org.nd4j.linalg.dataset.api.iterator.DataSetIterator;
import java.util.Collections;
import org.nd4j.linalg.dataset.api.preprocessor.serializer.NormalizerSerializer;
import org.nd4j.linalg.factory.Nd4j;
import org.nd4j.linalg.dataset.api.preprocessor.NormalizerStandardize;

public class Train {
    public static void main(String[] args) throws Exception {
        // 1. DATA LOADING
        List<double[]> processedData = loadAndEngineerData(new File(ModelConfig.CSV_PATH));
        
        int timeSteps = ModelConfig.TIME_STEPS;
        int numSamples = processedData.size() - timeSteps;
        int numFeatures = ModelConfig.INPUT_FEATURES;

        INDArray features = Nd4j.create(new int[]{numSamples, numFeatures, timeSteps}, 'c');
        INDArray labels = Nd4j.create(new int[]{numSamples, 1, timeSteps}, 'c');
        INDArray labelMask = Nd4j.create(new int[]{numSamples, timeSteps}, 'c');

        for (int i = 0; i < numSamples; i++) {
            for (int t = 0; t < timeSteps; t++) {
                double[] row = processedData.get(i + t);
                for (int f = 0; f < numFeatures; f++) {
                    features.putScalar(new int[]{i, f, t}, row[f]);
                }
            }
            double target = processedData.get(i + timeSteps)[6]; 
            labels.putScalar(new int[]{i, 0, timeSteps - 1}, target);
            labelMask.putScalar(new int[]{i, timeSteps - 1}, 1.0);
        }

        DataSet allData = new DataSet(features, labels, null, labelMask);

        // 2. STANDARDIZATION
        NormalizerStandardize normalizer = new NormalizerStandardize();
        normalizer.fitLabel(true);
        normalizer.fit(allData);
        normalizer.transform(allData);

        // 3. MODEL INIT
        MultiLayerNetwork model = new MultiLayerNetwork(LstmArchitecture.build());
        model.init();
        
        DataSetIterator iterator = new ExistingDataSetIterator(Collections.singletonList(allData));
        double currentLr = ModelConfig.LEARNING_RATE;
        double bestScore = Double.MAX_VALUE;
        int patienceCounter = 0;

        allData.setFeatures(allData.getFeatures().reshape(numSamples, numFeatures, timeSteps));
        allData.setLabels(allData.getLabels().reshape(numSamples, 1, timeSteps));

        System.out.println("Final Features Shape: " + java.util.Arrays.toString(allData.getFeatures().shape()));

        // 4. TRAINING LOOP
        System.out.println("Starting training on " + numSamples + " samples with batch size " + ModelConfig.BATCH_SIZE);
        for (int i = 0; i < ModelConfig.EPOCHS; i++) {
            iterator.reset(); 
            model.fit(iterator);
            
            double currentScore = model.score();
            
            if (currentScore < bestScore) {
                bestScore = currentScore;
                patienceCounter = 0;
            } else {
                patienceCounter++;
            }

            if (patienceCounter >= 25) {
                currentLr *= 0.5;
                model.setLearningRate(currentLr);
                patienceCounter = 0;
                System.out.println("Epoch " + i + " | LR reduced to: " + currentLr);
            }
            
            if (i % 50 == 0) {
                System.out.println("Epoch " + i + " | Current Loss: " + currentScore);
            }
        }
        
        // 5. EXPORT
        ModelSerializer.writeModel(model, ModelConfig.MODEL_EXPORT_PATH, true);
        NormalizerSerializer.getDefault().write(normalizer, ModelConfig.NORMALIZER_EXPORT_PATH);
        System.out.println("Model and Normalizer saved successfully.");
    }

    public static List<double[]> loadAndEngineerData(File file) throws Exception {
        List<double[]> list = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(file))) {
            String line = br.readLine(); // skip header
            Double lastConsumption = null;
            
            while ((line = br.readLine()) != null) {
                String[] p = line.split(",");
                if (p.length < 11) continue; // Skip malformed lines

                try {
                    double temp = Double.parseDouble(p[1]);
                    double occ = Double.parseDouble(p[4]);
                    double hvac = p[6].trim().equalsIgnoreCase("On") ? 1.0 : 0.0;
                    double consumption = Double.parseDouble(p[10]);
                    
                    // Robust Hour extraction
                    int hour = extractHour(p[0]);
                    double hSin = Math.sin(2 * Math.PI * hour / 24.0);
                    double hCos = Math.cos(2 * Math.PI * hour / 24.0);
                    
                    double lag1h = (lastConsumption == null) ? consumption : lastConsumption;
                    lastConsumption = consumption;

                    // Row structure: 6 features + 1 target = 7 elements
                    list.add(new double[]{temp, occ, hvac, lag1h, hSin, hCos, consumption});
                } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
                    // Skip lines with parsing errors
                }
            }
        }
        return list;
    }

    private static int extractHour(String timestamp) {
        try {
            // Handles "2024-01-01 15:00:00" or "15:00:00"
            String timePart = timestamp.contains(" ") ? timestamp.split(" ")[1] : timestamp;
            return Integer.parseInt(timePart.split(":")[0]);
        } catch (Exception e) {
            return 0; // Default fallback
        }
    }
}