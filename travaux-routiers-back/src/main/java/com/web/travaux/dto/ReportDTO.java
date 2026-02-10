package com.web.travaux.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
@Getter
@Setter
@RequiredArgsConstructor
public class ReportDTO {
    private Long id;
    private Double latitude;       // <-- ajouté
    private Double longitude;      // <-- ajouté
    private Double surface;
    private Double prix_par_m2;
    private Integer niveau;
    private Double budget;
    private String entreprise;
    private String statut;
    private Double pourcentage;
    private LocalDateTime date;
    private String description;
}