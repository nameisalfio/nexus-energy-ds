package com.energy.energy_server.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import lombok.extern.slf4j.Slf4j;

import com.energy.energy_server.model.User;
import com.energy.energy_server.repository.UserRepository;

@Slf4j
@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UserRepository repository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!repository.existsByEmail("admin@nexus.com")) {
                
                User admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin@nexus.com");
                admin.setPassword(passwordEncoder.encode("admin"));
                admin.setRole(User.Role.ADMIN);

                repository.save(admin);
                log.info("DEFAULT ADMIN USER CREATED: admin@nexus.com / admin");
            }

            if (!repository.existsByEmail("user@nexus.com")) {
                
                User user = new User();
                user.setUsername("user");
                user.setEmail("user@nexus.com");
                user.setPassword(passwordEncoder.encode("user"));
                user.setRole(User.Role.USER);

                repository.save(user);
                log.info("DEFAULT NON-ADMIN USER CREATED: user@nexus.com / user");
            }
        };
    }
}