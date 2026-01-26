package com.energy.energy_server.ai;

import java.io.File;

public class ModelConfig {
    public static final String DATA_FOLDER = "data";
    public static final String CSV_PATH = "dataset" + File.separator + "Energy_consumption.csv";
    public static final String MODEL_EXPORT_PATH = DATA_FOLDER + File.separator + "trained_model.zip";
    public static final String NORMALIZER_EXPORT_PATH = DATA_FOLDER + File.separator + "normalizer.bin";

    public static final int SEED = 12345;
    // Features: Temp, Occ, HVAC, Lag1h, HourSin, HourCos
    public static final int INPUT_FEATURES = 6; 
    public static final int LSTM_UNITS = 32; 
    public static final int OUTPUTS = 1;
    
    public static final double LEARNING_RATE = 0.01; 
    public static final double L2_REG = 1e-4; // weight_decay
    public static final int EPOCHS = 400;
    public static final int BATCH_SIZE = 16;
    public static final int TIME_STEPS = 12; // Window Size 12
    
    public static final double TRAIN_RATIO = 0.8; 



}