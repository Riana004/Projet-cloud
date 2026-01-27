package com.authentification.authentification.service;

import com.authentification.authentification.entity.User;
import com.authentification.authentification.entity.AppConfig;
import com.authentification.authentification.repository.UserRepository;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.authentification.authentification.repository.AppConfigRepository;
import lombok.RequiredArgsConstructor;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AppConfigRepository configRepository;

    /**
     * Vérifie le blocage LOCAL et sur FIREBASE.
     */
    public boolean isUserBlocked(String email) {
        // 1. Check local
        boolean locallyBlocked = userRepository.findByEmail(email)
                .map(User::isBlocked)
                .orElse(false);
        
        if (locallyBlocked) return true;

        // 2. Check Firebase
        try {
            UserRecord userRecord = FirebaseAuth.getInstance().getUserByEmail(email);
            return userRecord.isDisabled();
        } catch (FirebaseAuthException e) {
            return false; // Utilisateur inexistant sur Firebase
        }
    }

    /**
     * Incrémente localement et bloque sur les DEUX plateformes si max atteint.
     */
    @Transactional
    public void handleFailedLogin(String email) {
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setFailedAttempts(0);
            newUser.setBlocked(false);
            newUser.setPassword("FIREBASE_EXTERNAL");
            return userRepository.save(newUser);
        });

        int maxAttempts = configRepository.findById("max_login_attempts")
                .map(AppConfig::getConfigValue)
                .orElse(3);

        user.setFailedAttempts(user.getFailedAttempts() + 1);
        
        if (user.getFailedAttempts() >= maxAttempts) {
            user.setBlocked(true);
            // BLOQUER SUR FIREBASE
            updateFirebaseUserStatus(email, true);
        }
        
        userRepository.save(user);
    }

    /**
     * Débloque l'utilisateur localement ET sur Firebase.
     */
    @Transactional
    public void resetAttempts(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setFailedAttempts(0);
            user.setBlocked(false);
            userRepository.save(user);
            // DÉBLOQUER SUR FIREBASE
            updateFirebaseUserStatus(email, false);
        });
    }

    /**
     * Unlock manuel via ID (ex: Admin panel).
     */
    @Transactional
    public void unlockUser(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setBlocked(false);
            user.setFailedAttempts(0);
            userRepository.save(user);
            updateFirebaseUserStatus(user.getEmail(), false);
        });
    }

    /**
     * Méthode utilitaire pour communiquer avec Firebase.
     */
    private void updateFirebaseUserStatus(String email, boolean disable) {
        try {
            UserRecord userRecord = FirebaseAuth.getInstance().getUserByEmail(email);
            UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(userRecord.getUid())
                    .setDisabled(disable);
            FirebaseAuth.getInstance().updateUser(request);
            System.out.println("Firebase: Statut mis à jour pour " + email + " (Disabled: " + disable + ")");
        } catch (FirebaseAuthException e) {
            System.err.println("Erreur Firebase lors de la mise à jour du statut: " + e.getMessage());
        }
    }
}