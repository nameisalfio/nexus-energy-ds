package com.energy.energy_server.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.energy.energy_server.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Boolean existsByUsername(String username);
}