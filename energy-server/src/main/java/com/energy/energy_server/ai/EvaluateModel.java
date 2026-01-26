package com.energy.energy_server.ai;

import org.deeplearning4j.nn.multilayer.MultiLayerNetwork;
import org.deeplearning4j.util.ModelSerializer;
import org.nd4j.linalg.api.ndarray.INDArray;
import org.nd4j.linalg.dataset.api.preprocessor.NormalizerStandardize;
import org.nd4j.linalg.dataset.api.preprocessor.serializer.NormalizerSerializer;
import org.nd4j.linalg.factory.Nd4j;

import java.io.File;
import java.util.List;

/**
 * Technical evaluation of the trained Digital Twin.
 * Calculates the Mean Absolute Error (MAE) in real kWh units.
 */
public class EvaluateModel {
    public static void main(String[] args) throws Exception {
        // 1. LOAD EXPORTED ASSETS
        File modelFile = new File(ModelConfig.MODEL_EXPORT_PATH);
        File normFile = new File(ModelConfig.NORMALIZER_EXPORT_PATH);

        if (!modelFile.exists() || !normFile.exists()) {
            System.err.println("Error: Trained model or normalizer not found. Run Train.java first.");
            return;
        }

        MultiLayerNetwork model = ModelSerializer.restoreMultiLayerNetwork(modelFile);
        NormalizerStandardize normalizer = NormalizerSerializer.getDefault().restore(normFile);

        // 2. DATA PREPARATION
        // We use the same engineering logic from the Training class for consistency
        List<double[]> data = Train.loadAndEngineerData(new File(ModelConfig.CSV_PATH));
        
        int timeSteps = ModelConfig.TIME_STEPS;
        int numSamples = data.size() - timeSteps;
        int numFeatures = ModelConfig.INPUT_FEATURES;

        INDArray features = Nd4j.create(new int[]{numSamples, numFeatures, timeSteps}, 'c');
        double[] actualsKwh = new double[numSamples];

        for (int i = 0; i < numSamples; i++) {
            for (int t = 0; t < timeSteps; t++) {
                double[] row = data.get(i + t);
                for (int f = 0; f < numFeatures; f++) {
                    features.putScalar(new int[]{i, f, t}, row[f]);
                }
            }
            // Target is the consumption at index 6 of the row following the window
            actualsKwh[i] = data.get(i + timeSteps)[6];
        }

        // 3. INFERENCE
        // Apply training normalization parameters to the test features
        normalizer.transform(features);
        INDArray predictionsNormalized = model.output(features);

        // 4. PERFORMANCE METRICS CALCULATION
        double totalAbsError = 0;
        int count = 0;

        System.out.println("\n--- Sample Predictions (First 10 records) ---");
        for (int i = 0; i < numSamples; i++) {
            // Extract the prediction for the last timestep
            double normPred = predictionsNormalized.getDouble(i, 0, timeSteps - 1);
            
            // Revert normalization to get real kWh
            double predKwh = denormalize(normPred, normalizer);
            double realKwh = actualsKwh[i];

            totalAbsError += Math.abs(predKwh - realKwh);
            count++;

            if (i < 10) {
                System.out.printf("Actual: %6.2f kWh | Predicted: %6.2f kWh | Abs Error: %5.2f\n", 
                                  realKwh, predKwh, Math.abs(predKwh - realKwh));
            }
        }

        double finalMae = totalAbsError / count;
        System.out.println("\n" + "=".repeat(45));
        System.out.printf("FINAL MAE (Java Implementation): %.4f kWh\n", finalMae);
        System.out.println("=".repeat(45));
        
        if (finalMae < 4.2) {
            System.out.println("SUCCESS: Model performance is aligned with Python baseline.");
        } else {
            System.out.println("NOTICE: Performance variance detected. Check feature alignment.");
        }
    }

    private static double denormalize(double value, NormalizerStandardize norm) {
        double mean = norm.getLabelMean().getDouble(0);
        double std = norm.getLabelStd().getDouble(0);
        return (value * std) + mean;
    }
}