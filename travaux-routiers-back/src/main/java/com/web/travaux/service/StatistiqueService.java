package com.web.travaux.service;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.web.travaux.dto.StatsEntrepriseDto;
import com.web.travaux.dto.StatsGlobalDto;
import com.web.travaux.repository.StatistiqueRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StatistiqueService {

    private final StatistiqueRepository repo;

    public Map<String, Object> statsCompletes() {

        List<Object[]> data = repo.findDelaisTermines();

        List<Double> delais = new ArrayList<>();
        Map<String, List<Double>> parEntreprise = new HashMap<>();

        for (Object[] row : data) {
            String entreprise = (String) row[0];
            Double delai = ((Number) row[1]).doubleValue();

            delais.add(delai);

            parEntreprise
                .computeIfAbsent(entreprise, k -> new ArrayList<>())
                .add(delai);
        }

        double moyenne = delais.stream().mapToDouble(d -> d).average().orElse(0);
        double min = delais.stream().mapToDouble(d -> d).min().orElse(0);
        double max = delais.stream().mapToDouble(d -> d).max().orElse(0);

        StatsGlobalDto global = new StatsGlobalDto(
            moyenne, min, max, delais.size()
        );

        List<StatsEntrepriseDto> entreprises = parEntreprise.entrySet()
            .stream()
            .map(e -> new StatsEntrepriseDto(
                e.getKey(),
                e.getValue().stream().mapToDouble(d -> d).average().orElse(0),
                e.getValue().size()
            ))
            .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("global", global);
        result.put("entreprises", entreprises);

        return result;
    }
}
