package com.web.travaux.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
@Getter
@Setter
public class UpdateReportDTO {
    private String statut;
    private Double surfaceM2;
    private Double budget;
    private String entreprise;
    private LocalDateTime dateModification;

}
