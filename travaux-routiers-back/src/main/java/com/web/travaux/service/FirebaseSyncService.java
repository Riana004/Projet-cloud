package com.web.travaux.service;

import java.time.LocalDateTime;

import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.FirebaseAuthException;
import com.web.travaux.entity.User;

import org.springframework.stereotype.Service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.database.FirebaseDatabase;
import com.web.travaux.dto.ReportDTO;
import com.web.travaux.entity.Avancement;
import com.web.travaux.entity.Signalement;
import com.web.travaux.entity.StatutSignalement;
import com.web.travaux.repository.SignalementRepository;
import com.web.travaux.repository.StatutSignalementRepository;
import com.web.travaux.repository.AvancementRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import com.web.travaux.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class FirebaseSyncService {
    private final SignalementRepository signalementRepository;
    private final StatutSignalementRepository statutRepo;
     private final Firestore firestore; 
    private final UserRepository userRepository;
    private final AvancementRepository avancementRepository;
     public void syncReports(List<ReportDTO> reports) {
        reports.forEach(r ->
            FirebaseDatabase.getInstance()
                .getReference("reports")
                .child(r.getId().toString())
                .setValueAsync(r)
        );
    }

    @Transactional
    public void syncFromPostgresToFirebase() {

        try {
            List<Signalement> signalements = signalementRepository.findAll();

            for (Signalement s : signalements) {

                String firebaseId = s.getIdUtilisateur();

                if (firebaseId == null || firebaseId.isEmpty()) {
                    System.out.println("⚠ Signalement local sans idUtilisateur, ignoré");
                    continue;
                }

                Map<String, Object> data = new HashMap<>();

                data.put("description", s.getDescription());
                data.put("surface", s.getSurface());
                data.put("budget", s.getBudget());
                data.put("entreprise_concerne", s.getEntrepriseConcerne());

                // 🌍 latitude / longitude → GeoPoint
                if (s.getLatitude() != null && s.getLongitude() != null) {
                    data.put(
                        "location",
                        new com.google.cloud.firestore.GeoPoint(
                            s.getLatitude(),
                            s.getLongitude()
                        )
                    );
                }

                // 🕒 date → Timestamp Firebase
                if (s.getDateSignalement() != null) {
                    data.put(
                        "date_signalement",
                        com.google.cloud.Timestamp.of(
                            java.util.Date.from(
                                s.getDateSignalement()
                                    .atZone(ZoneId.systemDefault())
                                    .toInstant()
                            )
                        )
                    );
                }

                // 📌 statut
                if (s.getStatut() != null) {
                    data.put("id_statut", s.getStatut().getStatut());
                }

                // 🔄 upsert Firebase
                firestore
                    .collection("signalements")
                    .document(firebaseId)
                    .set(data);

            }

        } catch (Exception e) {
            throw new RuntimeException("Erreur sync PostgreSQL → Firebase", e);
        }
    }


   
@Transactional
public void syncFromFirebaseToPostgres() {
    try {
        ApiFuture<QuerySnapshot> future = firestore.collection("signalements").get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();

        for (QueryDocumentSnapshot doc : docs) {
            String firebaseId = doc.getId();

            List<Signalement> existingList = signalementRepository.findAllByIdUtilisateur(firebaseId);
            Signalement s;
            if (!existingList.isEmpty()) {
                s = existingList.get(0);
                if (existingList.size() > 1) {
                    System.out.println("⚠ Doublons détectés pour " + firebaseId);
                }
            } else {
                s = new Signalement();
            }

            s.setIdUtilisateur(firebaseId);
            s.setDescription(doc.getString("description"));

            // GeoPoint → latitude / longitude
            com.google.cloud.firestore.GeoPoint geo = doc.getGeoPoint("location");
            if (geo != null) {
                s.setLatitude(geo.getLatitude());
                s.setLongitude(geo.getLongitude());
            } else {
                s.setLatitude(0.0);
                s.setLongitude(0.0);
            }

            // Surface / Budget
            s.setSurface(doc.getDouble("surface") != null ? doc.getDouble("surface") : 0.0);
            s.setBudget(doc.getDouble("budget") != null ? doc.getDouble("budget") : 0.0);

            // Niveau / Prix_par_m2
            s.setNiveau(doc.getLong("niveau") != null ? doc.getLong("niveau").intValue() : 1);
            s.setPrix_par_m2(doc.getDouble("prix_par_m2") != null ? doc.getDouble("prix_par_m2") : 1000.0);

            // entreprise_concerne
            String entreprise = doc.getString("entreprise_concerne");
            s.setEntrepriseConcerne(entreprise != null ? entreprise : "Non renseigné");

            // Date signalement
            com.google.cloud.Timestamp ts = doc.getTimestamp("date_signalement");
            if (ts != null) {
                s.setDateSignalement(
                    ts.toDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime()
                );
            } else {
                s.setDateSignalement(LocalDateTime.now());
            }

            // Statut
            String statutLabel = doc.getString("id_statut");
            StatutSignalement statut = statutRepo.findByStatut(statutLabel != null ? statutLabel : "Nouveau");
            s.setStatut(statut);

            // Updated_at
            if (ts != null) {
                s.setUpdatedAt(ts.toSqlTimestamp());
            } else {
                s.setUpdatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
            }

            signalementRepository.save(s);
        }

    } catch (Exception e) {
        throw new RuntimeException("Erreur sync Firebase → Postgres", e);
    }
}

    

@Transactional
public void syncUsersToFirebase() {

    List<User> users = userRepository.findAll();

    for (User u : users) {

        try {

            // Vérifie si déjà existant dans Firebase
            try {
                FirebaseAuth.getInstance().getUserByEmail(u.getEmail());
                System.out.println("User déjà présent : " + u.getEmail());
                continue;
            } catch (FirebaseAuthException ignored) {
                // pas trouvé → on le crée
            }

            UserRecord.CreateRequest request =
                new UserRecord.CreateRequest()
                    .setEmail(u.getEmail())
                    .setPassword(u.getPassword());

            FirebaseAuth.getInstance().createUser(request);

            System.out.println("User envoyé vers Firebase : " + u.getEmail());

        } catch (Exception e) {
            System.err.println("Erreur user : " + u.getEmail());
        }
    }
}

@Transactional
public void syncAvancementFromFirebase() {
    try {
        ApiFuture<QuerySnapshot> future = firestore.collection("avancement").get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();

        for (QueryDocumentSnapshot doc : docs) {

            String avancementId = doc.getId();
            Avancement a = new Avancement();

            // ⚡ Signalement associé
            String signalementFirebaseId = doc.getString("signalementId");
            if (signalementFirebaseId == null) {
                System.out.println("⚠ Avancement " + avancementId + " sans signalement, ignoré");
                continue;
            }
            List<Signalement> signalements = signalementRepository.findAllByIdUtilisateur(signalementFirebaseId);
            if (signalements.isEmpty()) {
                System.out.println("⚠ Signalement Firebase " + signalementFirebaseId + " introuvable pour avancement " + avancementId);
                continue;
            }
            a.setSignalement(signalements.get(0));

            // 📌 Statuts
            String ancienStatutLabel = doc.getString("ancien_statut_id");
            if (ancienStatutLabel != null) {
                a.setAncienStatut(statutRepo.findByStatut(ancienStatutLabel));
            }

            String nouveauStatutLabel = doc.getString("nouveau_statut_id");
            if (nouveauStatutLabel != null) {
                a.setNouveauStatut(statutRepo.findByStatut(nouveauStatutLabel));
            } else {
                System.out.println("⚠ Avancement " + avancementId + " sans nouveau statut, ignoré");
                continue;
            }

            // 🕒 Date
            com.google.cloud.Timestamp ts = doc.getTimestamp("date_modification");
            if (ts != null) {
                a.setDateModification(
                    ts.toDate()
                      .toInstant()
                      .atZone(ZoneId.systemDefault())
                      .toLocalDateTime()
                );
            } else {
                a.setDateModification(LocalDateTime.now());
            }

            avancementRepository.save(a);
        }

        System.out.println("✅ Synchronisation des avancements terminée");
    } catch (Exception e) {
        throw new RuntimeException("Erreur sync Avancements Firebase → Postgres", e);
    }
}

@Transactional
public void syncAvancementToFirebase() {
    try {
        // Récupère tous les avancements depuis PostgreSQL
        List<Avancement> avancements = avancementRepository.findAll();

        for (Avancement a : avancements) {

            // Vérifie que l'avancement a un signalement associé
            if (a.getSignalement() == null || a.getSignalement().getIdUtilisateur() == null) {
                System.out.println("⚠ Avancement " + a.getId() + " sans signalement, ignoré");
                continue;
            }

            Map<String, Object> data = new HashMap<>();

            // Signalement lié
            data.put("signalementId", a.getSignalement().getIdUtilisateur());

            // Statuts
            if (a.getAncienStatut() != null) {
                data.put("ancien_statut_id", a.getAncienStatut().getStatut());
            }
            if (a.getNouveauStatut() != null) {
                data.put("nouveau_statut_id", a.getNouveauStatut().getStatut());
            }

            // Date modification
            if (a.getDateModification() != null) {
                data.put(
                    "date_modification",
                    com.google.cloud.Timestamp.of(
                        java.util.Date.from(
                            a.getDateModification()
                             .atZone(ZoneId.systemDefault())
                             .toInstant()
                        )
                    )
                );
            } else {
                data.put(
                    "date_modification",
                    com.google.cloud.Timestamp.now()
                );
            }

            // 🔄 Upsert vers Firebase (document par id PostgreSQL)
            firestore
                .collection("avancement")
                .document(a.getId().toString())
                .set(data);

            System.out.println("Avancement " + a.getId() + " synchronisé vers Firebase");
        }

        System.out.println("✅ Tous les avancements ont été synchronisés vers Firebase");
    } catch (Exception e) {
        throw new RuntimeException("Erreur sync Avancements PostgreSQL → Firebase", e);
    }
}


}
