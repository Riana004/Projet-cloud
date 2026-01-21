package com.web.travaux.controller;

import com.web.travaux.entity.Signalement;
import com.web.travaux.repository.SignalementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;

@RestController
@RequestMapping("/api/signalements")
public class SignalementController {

    @Autowired
    private SignalementRepository signalementRepository;

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

    // 4. Mettre à jour un signalement
    @PutMapping("/{id}")
    public ResponseEntity<Signalement> updateSignalement(
            @PathVariable Long id,
            @RequestBody Signalement updatedSignalement
    ) {
        return signalementRepository.findById(id).map(signalement -> {
            signalement.setDescription(updatedSignalement.getDescription());
            signalement.setLatitude(updatedSignalement.getLatitude());
            signalement.setLongitude(updatedSignalement.getLongitude());
            signalement.setSurface(updatedSignalement.getSurface());
            signalement.setBudget(updatedSignalement.getBudget());
            signalement.setEntrepriseConcerne(updatedSignalement.getEntrepriseConcerne());
            signalement.setStatut(updatedSignalement.getStatut());
            signalement.setUpdatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
            return ResponseEntity.ok(signalementRepository.save(signalement));
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
