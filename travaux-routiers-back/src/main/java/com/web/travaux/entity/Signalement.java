package com.web.travaux.entity;

import jakarta.persistence.*;
import lombok.*;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.sql.Timestamp;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;


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

    @Column(nullable = true, columnDefinition = "TEXT")
    private String description;

    @Column(name = "date_signalement", nullable = false)
    private LocalDateTime dateSignalement;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_statut")
    private StatutSignalement statut;


    @Column(name = "is_dirty", nullable = false)
    private boolean isDirty;

    @Column(name = "updated_at", nullable = false, updatable = false)
    private Timestamp updatedAt;

    @Column(name = "surface", nullable = false)
    private double surface;

    @Column(name = "budget", nullable = false)
    private double budget;

    @Column(name = "entreprise_concerne", nullable = false, length = 255)
    private String entrepriseConcerne;

    @OneToMany(mappedBy = "signalement", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<Photo> photos;

    @Column(name = "prix_par_m2")
    private Double prix_par_m2;

    @Column(name = "niveau")
    private Integer niveau;

}
