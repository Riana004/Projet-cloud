package com.web.travaux.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.web.travaux.dto.ReportDTO;
import com.web.travaux.entity.Signalement;
import com.web.travaux.repository.SignalementRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final SignalementRepository signalementRepository;

    public List<ReportDTO> getAllReports() {
        return signalementRepository.findAll()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    private ReportDTO toDTO(Signalement s) {
        ReportDTO dto = new ReportDTO();
        dto.setId(s.getId());
        dto.setLatitude(s.getLatitude());
        dto.setLongitude(s.getLongitude());
        dto.setDate(s.getDateSignalement());
        dto.setStatut(s.getStatut().getStatut()); // NOUVEAU / EN_COURS / TERMINE
        dto.setSurfaceM2(s.getSurface());
        dto.setBudget(s.getBudget());
        dto.setEntreprise(s.getEntrepriseConcerne());
        return dto;
    }
}
