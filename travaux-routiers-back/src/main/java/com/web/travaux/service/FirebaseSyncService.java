package com.web.travaux.service;

<<<<<<< HEAD
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.database.FirebaseDatabase;
import com.web.travaux.dto.ReportDTO;
import com.web.travaux.entity.Signalement;
import com.web.travaux.entity.StatutSignalement;
import com.web.travaux.repository.SignalementRepository;
import com.web.travaux.repository.StatutSignalementRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FirebaseSyncService {

    private final SignalementRepository signalementRepository;
    private final StatutSignalementRepository statutRepo;
     private final Firestore firestore; 
=======
import java.util.List;

import org.springframework.stereotype.Service;

import com.google.firebase.database.FirebaseDatabase;
import com.web.travaux.dto.ReportDTO;

@Service
public class FirebaseSyncService {

>>>>>>> 31cc15c9a79236d8b32735cc960b5a8b3e3642a7
    public void syncReports(List<ReportDTO> reports) {
        reports.forEach(r ->
            FirebaseDatabase.getInstance()
                .getReference("reports")
                .child(r.getId().toString())
                .setValueAsync(r)
        );
    }
<<<<<<< HEAD


    @Transactional
    public void syncFromFirebaseToPostgres() {

        try {
            ApiFuture<QuerySnapshot> future =
                firestore.collection("signalements").get();

            List<QueryDocumentSnapshot> docs = future.get().getDocuments();

            for (QueryDocumentSnapshot doc : docs) {

                String firebaseId = doc.getId();

                // 🔍 Vérifier si le signalement existe déjà
                Optional<Signalement> existing =
                    signalementRepository.findByIdUtilisateur(firebaseId);

                Signalement s = existing.orElseGet(Signalement::new);

                s.setIdUtilisateur(firebaseId);
                s.setDescription(doc.getString("description"));
                s.setLatitude(doc.getDouble("latitude"));
                s.setLongitude(doc.getDouble("longitude"));
                s.setSurface(doc.getDouble("surface"));
                s.setBudget(doc.getDouble("budget"));
                s.setEntrepriseConcerne(doc.getString("entreprise"));

                // 🕒 Date
                s.setDateSignalement(
                    doc.getTimestamp("dateSignalement")
                       .toDate()
                       .toInstant()
                       .atZone(ZoneId.systemDefault())
                       .toLocalDateTime()
                );

                // 📌 Statut
                String statutLabel = doc.getString("statut");
                StatutSignalement statut = statutRepo.findByStatut(statutLabel);
                s.setStatut(statut);

                signalementRepository.save(s);
            }

        } catch (Exception e) {
            throw new RuntimeException("Erreur sync Firebase → Postgres", e);
        }
    }
=======
>>>>>>> 31cc15c9a79236d8b32735cc960b5a8b3e3642a7
}
