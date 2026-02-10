package com.web.travaux.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "avancements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Avancement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signalement_id", nullable = false)
    private Signalement signalement;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ancien_statut_id")
    private StatutSignalement ancienStatut;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "nouveau_statut_id", nullable = false)
    private StatutSignalement nouveauStatut;

    @Column(name = "date_modification", nullable = false)
    private LocalDateTime dateModification;
}
