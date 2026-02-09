package com.web.travaux.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.web.travaux.dto.ReportDTO;
import com.web.travaux.dto.UpdateReportDTO;
import com.web.travaux.entity.Signalement;
import com.web.travaux.entity.Avancement;
import com.web.travaux.repository.SignalementRepository;
import com.web.travaux.repository.StatutSignalementRepository;
import com.web.travaux.repository.AvancementRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final SignalementRepository signalementRepository;
    private final StatutSignalementRepository statutRepo;
    private final AvancementRepository avancementRepository;

    // ===============================
    // GET ALL
    // ===============================
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
        dto.setStatut(s.getStatut().getStatut());
        dto.setPourcentage(s.getStatut().getPourcentage());
        dto.setSurfaceM2(s.getSurface());
        dto.setBudget(s.getBudget());
        dto.setEntreprise(s.getEntrepriseConcerne());
        dto.setDescription(s.getDescription());
        return dto;
    }

    // ===============================
    // RULES TRANSITION
    // ===============================
    private boolean isTransitionAllowed(Long from, Long to) {
        if (from == 1L && (to == 2L || to == 4L)) return true;
        if (from == 2L && (to == 3L || to == 4L)) return true;
        return false;
    }

    // ===============================
    // UPDATE REPORT
    // ===============================
    @Transactional
    public void updateReport(Long id, UpdateReportDTO dto) {

        Signalement s = signalementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Signalement introuvable"));

        var ancienStatut = s.getStatut();

        // ----- Gestion statut -----
        if (dto.getStatut() != null) {

            var nouveauStatut = statutRepo.findByStatut(dto.getStatut());

            if (nouveauStatut == null)
                throw new RuntimeException("Statut inconnu: " + dto.getStatut());

            // Si statut identique → rien faire
            if (!ancienStatut.getId().equals(nouveauStatut.getId())) {

                // Vérifier transition autorisée
                if (!isTransitionAllowed(ancienStatut.getId(), nouveauStatut.getId())) {
                    throw new RuntimeException(
                        "Transition interdite: " +
                        ancienStatut.getId() + " → " + nouveauStatut.getId()
                    );
                }

                // appliquer changement
                s.setStatut(nouveauStatut);

                // créer avancement
                Avancement avancement = Avancement.builder()
                        .signalement(s)
                        .ancienStatut(ancienStatut)
                        .nouveauStatut(nouveauStatut)
                        .dateModification(dto.getDateModification())
                        .build();

                avancementRepository.save(avancement);
            }
        }

        // ----- autres champs -----
        if (dto.getSurfaceM2() != null)
            s.setSurface(dto.getSurfaceM2());

        if (dto.getBudget() != null)
            s.setBudget(dto.getBudget());

        if (dto.getEntreprise() != null)
            s.setEntrepriseConcerne(dto.getEntreprise());
    }

    // ===============================
    // DELETE
    // ===============================
    @Transactional
    public void deleteReport(Long id) {
        signalementRepository.deleteById(id);
    }
}
