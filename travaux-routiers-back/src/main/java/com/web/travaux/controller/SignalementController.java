package com.web.travaux.controller;

import com.web.travaux.entity.Signalement;
import com.web.travaux.repository.SignalementRepository;
import com.web.travaux.repository.AvancementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.web.travaux.dto.UpdateSignalementDTO;
import java.util.List;
import com.web.travaux.entity.Avancement;
import com.web.travaux.repository.StatutSignalementRepository;
@RestController
@RequestMapping("/api/signalements")
public class SignalementController {

    @Autowired
    private SignalementRepository signalementRepository;

    @Autowired
    private AvancementRepository avancementRepository;

    @Autowired
    private StatutSignalementRepository statutRepository;

    // 1. Lister tous les signalements
    @GetMapping
    public List<Signalement> getAllSignalements() {
        return signalementRepository.findAll();
    }

    // 2. Récupérer un signalement par ID
    @GetMapping("/{id}")
    public ResponseEntity<Signalement> getSignalementById(@PathVariable Long id) {
        return signalementRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. Ajouter un nouveau signalement
    @PostMapping
    public Signalement createSignalement(@RequestBody Signalement signalement) {
        // updatedAt et isDirty peuvent être initialisés ici
        signalement.setUpdatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
        signalement.setDirty(false);
        return signalementRepository.save(signalement);
    }
@PutMapping("/{id}")
public ResponseEntity<Signalement> updateSignalement(
        @PathVariable Long id,
        @RequestBody UpdateSignalementDTO dto
) {
    return signalementRepository.findById(id).map(signalement -> {

        var ancienStatut = signalement.getStatut();
        var nouveauStatut = statutRepository.findByStatut(dto.getStatut());
        System.out.println("Ancien: " + ancienStatut.getStatut());
        System.out.println("Nouveau: " + nouveauStatut.getStatut());

        if (nouveauStatut == null) {
            throw new RuntimeException("Statut introuvable : " + dto.getStatut());
        }
        signalement.setDescription(dto.getDescription());
        signalement.setLatitude(dto.getLatitude());
        signalement.setLongitude(dto.getLongitude());
        signalement.setSurface(dto.getSurface());
        signalement.setBudget(dto.getBudget());
        signalement.setEntrepriseConcerne(dto.getEntrepriseConcerne());
        signalement.setStatut(nouveauStatut);
        signalement.setUpdatedAt(new java.sql.Timestamp(System.currentTimeMillis()));

        Signalement saved = signalementRepository.save(signalement);

        if (ancienStatut != null &&
            !ancienStatut.getId().equals(nouveauStatut.getId())) {

            Avancement avancement = Avancement.builder()
                    .signalement(saved)
                    .ancienStatut(ancienStatut)
                    .nouveauStatut(nouveauStatut)
                    .dateModification(dto.getDateModification())
                    .build();

            avancementRepository.save(avancement);
        }
        return ResponseEntity.ok(saved);

    }).orElse(ResponseEntity.notFound().build());
}


    // 5. Supprimer un signalement
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSignalement(@PathVariable Long id) {
        return signalementRepository.findById(id).map(signalement -> {
            signalementRepository.delete(signalement);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
