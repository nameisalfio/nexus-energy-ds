package com.energy.energy_server.ai;

import org.deeplearning4j.nn.conf.MultiLayerConfiguration;
import org.deeplearning4j.nn.conf.NeuralNetConfiguration;
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
                        .updater(new Adam(ModelConfig.LEARNING_RATE))
                        .l2(ModelConfig.L2_REG)
                        .list()
                        .layer(0, new LSTM.Builder()
                                .nIn(ModelConfig.INPUT_FEATURES) 
                                .nOut(ModelConfig.LSTM_UNITS)    
                                .activation(Activation.TANH)
                                .weightInit(WeightInit.XAVIER)
                                .dropOut(0.6) 
                                .build())
                        .layer(1, new RnnOutputLayer.Builder(LossFunctions.LossFunction.MSE)
                                .activation(Activation.IDENTITY)
                                .nIn(ModelConfig.LSTM_UNITS)
                                .nOut(ModelConfig.OUTPUTS)
                                .build())
                        .build();
        }
}