package com.web.travaux.dto;

import lombok.Getter;
import lombok.Setter;
@Getter
@Setter
public class UpdateReportDTO {
    private String statut;
    private Double surfaceM2;
    private Double budget;
    private String entreprise;
}
