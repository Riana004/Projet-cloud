package com.web.travaux.controller;

import com.web.travaux.dto.PhotoDTO;
import com.web.travaux.dto.SignalementTooltipDTO;
import com.web.travaux.entity.Signalement;
import com.web.travaux.service.FirestorePhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.sql.Timestamp;
import java.util.List;

import com.web.travaux.repository.SignalementRepository;

@RestController
@RequestMapping("/api/signalements")
@RequiredArgsConstructor
public class PhotoController {

    private final FirestorePhotoService firestorePhotoService;
    private final SignalementRepository signalementRepository;

    @GetMapping("/{id}/tooltip")
public ResponseEntity<SignalementTooltipDTO> getTooltipInfo(@PathVariable Long id) {

    Signalement signalement = signalementRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));

    // 🔥 utiliser id_utilisateur comme clé pour Firestore
    String firebaseId = signalement.getIdUtilisateur();

    List<PhotoDTO> photos = firestorePhotoService.getPhotosBySignalementId(firebaseId);

    Timestamp date = signalement.getDateSignalement() == null
        ? null
        : Timestamp.valueOf(signalement.getDateSignalement());

    SignalementTooltipDTO dto = SignalementTooltipDTO.builder()
        .id(signalement.getId())
        .date(date)
        .status(signalement.getStatut().getStatut())
        .surfaceM2(signalement.getSurface())
        .budget(signalement.getBudget())
        .entreprise(signalement.getEntrepriseConcerne())
        .photos(photos)
        .build();

    return ResponseEntity.ok(dto);
}


    @GetMapping("/{id}/photo")
public ResponseEntity<List<PhotoDTO>> getPhotos(@PathVariable Long id) {
    Signalement s = signalementRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));

    List<PhotoDTO> photos = firestorePhotoService.getPhotosBySignalementId(s.getIdUtilisateur());
    return ResponseEntity.ok(photos);
}

}
