package com.energy.energy_server.ai;

import java.io.File;

public class ModelConfig {
    public static final String DATA_FOLDER = "data";
    public static final String CSV_PATH = "dataset" + File.separator + "Energy_consumption.csv";
    public static final String MODEL_EXPORT_PATH = DATA_FOLDER + File.separator + "trained_model.zip";
    public static final String NORMALIZER_EXPORT_PATH = DATA_FOLDER + File.separator + "normalizer.bin";

    public static final int SEED = 12345;
    public static final int INPUT_FEATURES = 4; 
    public static final int LSTM_UNITS = 64;
    public static final int OUTPUTS = 1;
    
    public static final double LEARNING_RATE = 0.005; 
    public static final int EPOCHS = 500;
    public static final int BATCH_SIZE = 32;
    public static final int TIME_STEPS = 24; // 24 hours sliding window
    
    public static final double TRAIN_RATIO = 0.8; 
}