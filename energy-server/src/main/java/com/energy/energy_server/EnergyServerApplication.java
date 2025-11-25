package com.energy.energy_server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class EnergyServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(EnergyServerApplication.class, args);
	}

}
