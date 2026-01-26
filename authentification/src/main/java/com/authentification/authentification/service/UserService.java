package com.authentification.authentification.service;

import com.authentification.authentification.entity.User;
import com.authentification.authentification.repository.UserRepository;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final ConnectivityService connectivity;

    public void updatePassword(Long userId, String newPassword) {
        // 1. VÉRIFICATION CRITIQUE DE LA CONNECTIVITÉ
        if (!connectivity.isOnline()) {
            throw new RuntimeException("Modification impossible : Une connexion Internet est requise pour mettre à jour votre mot de passe et synchroniser votre compte Cloud.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable dans la base locale."));

        try {
            // 2. MISE À JOUR FIREBASE (Priorité)
            // On récupère l'utilisateur Firebase pour s'assurer qu'il existe
            UserRecord userRecord = FirebaseAuth.getInstance().getUserByEmail(user.getEmail());
            
            UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(userRecord.getUid())
                    .setPassword(newPassword);
            
            FirebaseAuth.getInstance().updateUser(request);

            // 3. MISE À JOUR POSTGRES (Uniquement si Firebase a réussi)
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            System.out.println("Succès : Mot de passe synchronisé sur les deux plateformes.");

        } catch (Exception e) {
            // En cas d'erreur de communication avec Firebase (ex: compte supprimé sur le cloud)
            throw new RuntimeException("Échec de la synchronisation avec Firebase : " + e.getMessage());
        }
    }
}