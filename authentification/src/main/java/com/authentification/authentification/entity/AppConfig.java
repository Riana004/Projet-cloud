package com.authentification.authentification.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "app_config")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AppConfig {

    @Id
    @Column(name = "config_key", length = 50)
    private String configKey; // ex: "max_login_attempts"

    @Column(name = "config_value", nullable = false)
    private Integer configValue; // ex: 3
}