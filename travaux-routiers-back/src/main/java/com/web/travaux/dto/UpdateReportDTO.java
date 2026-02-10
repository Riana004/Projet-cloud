package com.web.travaux.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class UpdateReportDTO {
    private String statut;            // le statut du signalement
    private Double surface;           // surface en m²
    private Double prixParM2;         // prix par m²
    private Integer niveau;           // niveau
    private String entreprise;        // entreprise concernée
    private LocalDateTime dateModification; // date de modification
}
