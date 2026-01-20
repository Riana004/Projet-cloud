package com.signalementroutier.projetcloud.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "SIGNALEMENT")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Signalement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_utilisateur", nullable = false, length = 255)
    private String idUtilisateur;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "date_signalement", nullable = false)
    private LocalDateTime dateSignalement;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_statut")
    private StatutSignalement statut;
}
