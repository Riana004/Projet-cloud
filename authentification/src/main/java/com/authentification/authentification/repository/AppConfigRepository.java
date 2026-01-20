package com.authentification.authentification.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.authentification.authentification.entity.AppConfig;

import java.util.Optional;

public interface AppConfigRepository extends JpaRepository<AppConfig, String> {
    Optional<AppConfig> findByConfigKey(String configKey);
}