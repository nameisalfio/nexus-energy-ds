package com.energy.energy_server.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.energy.energy_server.model.User;
import com.energy.energy_server.repository.UserRepository;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UserRepository repository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!repository.existsByEmail("admin@energy.com")) {
                
                User admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin@energy.com");
                admin.setPassword(passwordEncoder.encode("admin"));
                admin.setRole(User.Role.ADMIN);

                repository.save(admin);
                System.out.println("✅ DEFAULT ADMIN USER CREATED: admin@energy.com / admin");
            }
        };
    }
}