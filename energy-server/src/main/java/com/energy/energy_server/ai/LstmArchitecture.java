package com.energy.energy_server.ai;

import org.deeplearning4j.nn.api.OptimizationAlgorithm;
import org.deeplearning4j.nn.conf.MultiLayerConfiguration;
import org.deeplearning4j.nn.conf.NeuralNetConfiguration;
import org.deeplearning4j.nn.conf.layers.DenseLayer;
import org.deeplearning4j.nn.conf.layers.LSTM;
import org.deeplearning4j.nn.conf.layers.RnnOutputLayer;
import org.deeplearning4j.nn.weights.WeightInit;
import org.nd4j.linalg.activations.Activation;
import org.nd4j.linalg.learning.config.Adam;
import org.nd4j.linalg.lossfunctions.LossFunctions;

public class LstmArchitecture {

    public static MultiLayerConfiguration build() {
        return new NeuralNetConfiguration.Builder()
                .seed(ModelConfig.SEED)
                .optimizationAlgo(OptimizationAlgorithm.STOCHASTIC_GRADIENT_DESCENT)
                .updater(new Adam(ModelConfig.LEARNING_RATE))
                .list()
                .layer(0, new LSTM.Builder()
                        .nIn(ModelConfig.INPUT_FEATURES) // 4 features
                        .nOut(ModelConfig.LSTM_UNITS)
                        .activation(Activation.TANH)
                        .weightInit(WeightInit.XAVIER)
                        .build())
                .layer(1, new DenseLayer.Builder()
                        .nIn(ModelConfig.LSTM_UNITS)
                        .nOut(32)
                        .activation(Activation.RELU)
                        .build())
                .layer(2, new RnnOutputLayer.Builder(LossFunctions.LossFunction.MSE)
                        .activation(Activation.IDENTITY)
                        .nIn(32)
                        .nOut(ModelConfig.OUTPUTS)
                        .build())
                .build();
    }
}