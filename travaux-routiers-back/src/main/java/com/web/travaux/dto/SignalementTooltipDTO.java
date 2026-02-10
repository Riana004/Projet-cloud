package com.web.travaux.dto;

import lombok.*;
import java.sql.Timestamp;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignalementTooltipDTO {
    private Long id;
    private Timestamp date;
    private String status; // "nouveau", "en cours", "terminé"
    private Double surfaceM2;
    private Double budget;
    private String entreprise;
    private List<PhotoDTO> photos; // Photos depuis Firestore
}