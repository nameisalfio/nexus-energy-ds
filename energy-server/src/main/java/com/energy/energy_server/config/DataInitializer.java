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
            if (!repository.existsByEmail("admin@nexus.com")) {
                
                User admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin@nexus.com");
                admin.setPassword(passwordEncoder.encode("admin"));
                admin.setRole(User.Role.ADMIN);

                repository.save(admin);
                System.out.println("✅ DEFAULT ADMIN USER CREATED: admin@nexus.com / admin");
            }

            if (!repository.existsByEmail("user@nexus.com")) {
                
                User user = new User();
                user.setUsername("user");
                user.setEmail("user@nexus.com");
                user.setPassword(passwordEncoder.encode("user"));
                user.setRole(User.Role.USER);

                repository.save(user);
                System.out.println("✅ DEFAULT NON-ADMIN USER CREATED: user@nexus.com / user");
            }
        };
    }
}