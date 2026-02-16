package com.energy.energy_server.api;

import com.energy.energy_server.exception.UserNotFoundException;
import com.energy.energy_server.model.User;
import com.energy.energy_server.repository.UserRepository;
import com.energy.energy_server.service.EnergySystemFacade;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final EnergySystemFacade facade;

    @Data
    static class RoleChangeRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Role is required")
        @Pattern(regexp = "USER|ADMIN", message = "Role must be USER or ADMIN")
        private String newRole;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException("User not found");
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/data/clear")
    public ResponseEntity<?> clearDatabase() {
        facade.clearAllData();
        return ResponseEntity.ok("Database cleared. Ready for a new CSV.");
    }

    @PostMapping("/users/change-role")
    public ResponseEntity<?> changeRole(@Valid @RequestBody RoleChangeRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        try {
            user.setRole(User.Role.valueOf(request.getNewRole().toUpperCase()));
            userRepository.save(user);
            return ResponseEntity.ok("Role updated to " + request.getNewRole());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role");
        }
    }

    @PostMapping("/ingest-dataset")
    public ResponseEntity<?> ingestData(@RequestParam("file") MultipartFile file) throws IOException {
        facade.handleDatasetUpload(file);
        return ResponseEntity.ok("Data ingested successfully");
    }

    @PostMapping("/simulation/start")
    public void startSimulation() {
        facade.startSimulation();
    }

    @PostMapping("/simulation/stop")
    public void stopSimulation() {
        facade.stopSimulation();
    }

}