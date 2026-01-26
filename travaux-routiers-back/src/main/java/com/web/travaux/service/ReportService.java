package com.web.travaux.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.web.travaux.dto.ReportDTO;
import com.web.travaux.dto.UpdateReportDTO;
import com.web.travaux.entity.Signalement;
import com.web.travaux.repository.SignalementRepository;
import com.web.travaux.repository.StatutSignalementRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final SignalementRepository signalementRepository;
    private final StatutSignalementRepository statutRepo;
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
        dto.setDescription(s.getDescription());
        return dto;
    }

    @Transactional
    public void updateReport(Long id, UpdateReportDTO dto) {
        Signalement s = signalementRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Signalement introuvable"));

        if (dto.getStatut() != null)
            s.setStatut(statutRepo.findByStatut(dto.getStatut()));

        if (dto.getSurfaceM2() != null)
            s.setSurface(dto.getSurfaceM2());

        if (dto.getBudget() != null)
            s.setBudget(dto.getBudget());

        if (dto.getEntreprise() != null)
            s.setEntrepriseConcerne(dto.getEntreprise());
    }
    @Transactional
    public void deleteReport(Long id) {
        signalementRepository.deleteById(id);
    }
}
