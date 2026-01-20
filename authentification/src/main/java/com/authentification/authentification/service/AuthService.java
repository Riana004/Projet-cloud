package com.authentification.authentification.service;

import com.authentification.authentification.entity.User;
import com.authentification.authentification.entity.AppConfig;
import com.authentification.authentification.repository.UserRepository;
import com.authentification.authentification.repository.AppConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AppConfigRepository configRepository;

    /**
     * Vérifie si l'utilisateur est bloqué dans la base PostgreSQL locale.
     */
    public boolean isUserLocallyBlocked(String email) {
        return userRepository.findByEmail(email)
                .map(User::isBlocked)
                .orElse(false);
    }

    /**
     * Incrémente les tentatives et bloque l'utilisateur si nécessaire.
     * Crée l'utilisateur "à la volée" s'il n'existe pas encore localement.
     */
    @Transactional
    public void handleFailedLogin(String email) {
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setFailedAttempts(0);
            newUser.setBlocked(false);
            return userRepository.save(newUser);
        });

        int maxAttempts = configRepository.findById("max_login_attempts")
                .map(AppConfig::getConfigValue)
                .orElse(3);

        user.setFailedAttempts(user.getFailedAttempts() + 1);
        
        if (user.getFailedAttempts() >= maxAttempts) {
            user.setBlocked(true);
        }
        
        userRepository.save(user);
    }

    /**
     * REMPLACE LA MÉTHODE MANQUANTE :
     * Remet le compteur d'erreurs à 0 après un succès.
     */
    @Transactional
    public void resetAttempts(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setFailedAttempts(0);
            user.setBlocked(false); // Par sécurité on s'assure qu'il n'est plus bloqué
            userRepository.save(user);
        });
    }

    /**
     * API REST pour débloquer manuellement via ID.
     */
    @Transactional
    public void unlockUser(Long userId) {
        userRepository.unlockUser(userId);
    }
}