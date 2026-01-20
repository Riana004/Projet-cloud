package com.signalementroutier.projetcloud.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "STATUT_SIGNALLEMENT")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatutSignalement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String statut;
}
