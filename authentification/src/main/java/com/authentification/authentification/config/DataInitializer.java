package com.authentification.authentification.config;

import com.authentification.authentification.entity.AppConfig;
import com.authentification.authentification.repository.AppConfigRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initConfig(AppConfigRepository repository) {
        return args -> {
            if (repository.findByConfigKey("max_login_attempts").isEmpty()) {
                repository.save(new AppConfig("max_login_attempts", 3));
                System.out.println("Configuration par défaut : max_login_attempts = 3");
            }
        };
    }
}