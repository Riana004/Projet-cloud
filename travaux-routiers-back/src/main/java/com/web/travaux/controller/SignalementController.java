package com.web.travaux.controller;

import com.web.travaux.dto.SignalementResponse;
import com.web.travaux.dto.SignalementSummaryResponse;
import com.web.travaux.entity.Signalement;
import com.web.travaux.repository.SignalementRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/signalements")
@CrossOrigin(origins = "*")
public class SignalementController {

    private final SignalementRepository signalementRepository;

    public SignalementController(SignalementRepository signalementRepository) {
        this.signalementRepository = signalementRepository;
    }

    @GetMapping
    public List<SignalementResponse> getAll() {
        return resolveSignalements();
    }

    @GetMapping("/summary")
    public SignalementSummaryResponse getSummary() {
        List<SignalementResponse> items = resolveSignalements();
        int totalPoints = items.size();
        double totalSurface = items.stream().mapToDouble(SignalementResponse::getSurfaceM2).sum();
        double totalBudget = items.stream().mapToDouble(SignalementResponse::getBudget).sum();
        int completed = 0;
        for (SignalementResponse item : items) {
            String status = item.getStatus();
            if (status != null && status.toLowerCase().startsWith("termin")) {
                completed++;
            }
        }
        int progressPercent = totalPoints == 0 ? 0 : Math.round((completed * 100f) / totalPoints);
        return new SignalementSummaryResponse(totalPoints, totalSurface, totalBudget, progressPercent);
    }

    private List<SignalementResponse> resolveSignalements() {
        List<Signalement> entities = signalementRepository.findAll();
        if (!entities.isEmpty()) {
            List<SignalementResponse> mapped = new ArrayList<>();
            for (Signalement entity : entities) {
                mapped.add(new SignalementResponse(
                        entity.getId(),
                        entity.getDescription(),
                        entity.getDateSignalement(),
                        entity.getStatut() != null ? entity.getStatut().getStatut() : "nouveau",
                        entity.getSurface(),
                        entity.getBudget(),
                        entity.getEntrepriseConcerne(),
                        entity.getLatitude(),
                        entity.getLongitude()
                ));
            }
            return mapped;
        }

        List<SignalementResponse> mock = new ArrayList<>();
        mock.add(new SignalementResponse(
                1L,
                "Nid de poule - Avenue de l'Indépendance",
                LocalDateTime.of(2026, 1, 12, 9, 30),
                "nouveau",
                12.5,
                1_200_000,
                "Rivo TP",
                -18.9097,
                47.5255
        ));
        mock.add(new SignalementResponse(
                2L,
                "Chaussée dégradée - Ankorondrano",
                LocalDateTime.of(2026, 1, 8, 14, 0),
                "en cours",
                45.0,
                4_500_000,
                "Saha Routes",
                -18.8735,
                47.5119
        ));
        mock.add(new SignalementResponse(
                3L,
                "Tranchée ouverte - Tsaralalana",
                LocalDateTime.of(2025, 12, 28, 16, 45),
                "terminé",
                8.2,
                900_000,
                "Tanà Infra",
                -18.8792,
                47.5042
        ));
        return mock;
    }
}
