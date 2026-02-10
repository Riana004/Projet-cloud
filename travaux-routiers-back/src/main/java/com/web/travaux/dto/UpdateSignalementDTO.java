package com.web.travaux.dto;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
@Getter
@Setter
@RequiredArgsConstructor
public class UpdateSignalementDTO {

    private String description;
    private Double latitude;
    private Double longitude;
    private Double surface;
    private Double budget;
    private String entrepriseConcerne;
    private String statut;

    private LocalDateTime dateModification; // 👈 date fournie
    private double prixParM2;
    private int niveau;
    // getters / setters
}
