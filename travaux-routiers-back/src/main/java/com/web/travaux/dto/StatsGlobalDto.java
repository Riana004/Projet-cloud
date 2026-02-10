package com.web.travaux.dto;

import lombok.Getter;
import lombok.AllArgsConstructor;
import lombok.Setter;
@Getter
@Setter
@AllArgsConstructor
public class StatsGlobalDto {
    private double delaiMoyenHeures;
    private double delaiMinHeures;
    private double delaiMaxHeures;
    private long totalTermines;
}
