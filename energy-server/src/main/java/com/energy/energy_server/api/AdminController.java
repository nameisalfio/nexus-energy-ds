package com.energy.energy_server.api;

import com.energy.energy_server.model.User;
import com.energy.energy_server.repository.UserRepository;
import com.energy.energy_server.service.EnergySystemFacade;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
        private String email;
        private String newRole;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/data/clear")
    public ResponseEntity<?> clearDatabase() {
        facade.clearAllData();
        return ResponseEntity.ok("Database cleared. Ready for a new CSV.");
    }

    @PostMapping("/users/change-role")
    public ResponseEntity<?> changeRole(@RequestBody RoleChangeRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            user.setRole(User.Role.valueOf(request.getNewRole().toUpperCase()));
            userRepository.save(user);
            return ResponseEntity.ok("Role updated to " + request.getNewRole());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid role");
        }
    }

}