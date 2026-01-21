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
    private Double latitude;
    private Double longitude;
    private LocalDateTime date;
    private String statut;
    private Double surfaceM2;
    private Double budget;
    private String entreprise;
    private String description;
    // getters & setters
}
