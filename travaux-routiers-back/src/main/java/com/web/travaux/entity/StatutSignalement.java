package com.web.travaux.entity;


import jakarta.persistence.*;
import lombok.*;

import java.sql.Timestamp;

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

    @Column(name = "is_dirty", nullable = false)
    private boolean isDirty;

    @Column(name = "updated_at", nullable = false, updatable = false)
    private Timestamp updatedAt;
}
