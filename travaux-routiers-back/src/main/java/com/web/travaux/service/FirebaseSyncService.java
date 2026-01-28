package com.web.travaux.service;

import java.time.LocalDateTime;

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
    public void syncReports(List<ReportDTO> reports) {
        reports.forEach(r ->
            FirebaseDatabase.getInstance()
                .getReference("reports")
                .child(r.getId().toString())
                .setValueAsync(r)
        );
    }


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

                // 🌐 GeoPoint → latitude / longitude
                com.google.cloud.firestore.GeoPoint geo = doc.getGeoPoint("location");
                if (geo != null) {
                    s.setLatitude(geo.getLatitude());
                    s.setLongitude(geo.getLongitude());
                } else {
                    s.setLatitude(0.0);
                    s.setLongitude(0.0);
                    System.out.println("⚠ Signalement " + firebaseId + " sans position, lat/lng = 0.0");
                }

                s.setSurface(doc.getDouble("surface") != null ? doc.getDouble("surface") : 0.0);
                s.setBudget(doc.getDouble("budget") != null ? doc.getDouble("budget") : 0.0);

                // ✅ entreprise_concerne obligatoire → valeur par défaut si null
                String entreprise = doc.getString("entreprise_concerne");
                s.setEntrepriseConcerne(entreprise != null ? entreprise : "Non renseigné");

                // 🕒 Date
                com.google.cloud.Timestamp ts = doc.getTimestamp("date_signalement");
                if (ts != null) {
                    s.setDateSignalement(
                        ts.toDate()
                        .toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDateTime()
                    );
                } else {
                    s.setDateSignalement(LocalDateTime.now());
                    System.out.println("⚠ Signalement " + firebaseId + " sans date, mise à jour avec maintenant");
                }

                // 📌 Statut
                String statutLabel = doc.getString("id_statut");
                StatutSignalement statut = statutRepo.findByStatut(statutLabel != null ? statutLabel : "Nouveau");
                s.setStatut(statut);

                s.setUpdatedAt(ts.toSqlTimestamp());

                signalementRepository.save(s);
            }

        } catch (Exception e) {
            throw new RuntimeException("Erreur sync Firebase → Postgres", e);
        }
    }

}
