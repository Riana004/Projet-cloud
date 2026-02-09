package com.web.travaux.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@RequiredArgsConstructor
public class StatsEntrepriseDto {
    private String entreprise;
    private double delaiMoyen;
    private long total;

    public StatsEntrepriseDto(String entreprise, double delaiMoyen, int total) {
        this.entreprise = entreprise;
        this.delaiMoyen = delaiMoyen;
        this.total = total;
}

}
