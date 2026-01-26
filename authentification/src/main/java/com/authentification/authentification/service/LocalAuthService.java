package com.authentification.authentification.service;

import com.authentification.authentification.entity.User;
import com.authentification.authentification.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j // Utilisation de Lombok pour les logs plus propres
public class LocalAuthService {

    private final UserRepository userRepository;
    
    // On injecte le bean PasswordEncoder configuré dans ton SecurityConfig
    // Ne jamais faire "new BCryptPasswordEncoder()" ici
    private final PasswordEncoder passwordEncoder;

    /**
     * Authentification locale (PostgreSQL).
     * Utilisée principalement en mode Offline.
     */
    public boolean authenticate(String email, String password) {
        return userRepository.findByEmail(email)
                .map(user -> {
                    // Vérifie si le mot de passe brut correspond au hash stocké
                    boolean isMatch = passwordEncoder.matches(password, user.getPassword());
                    
                    if (isMatch) {
                        log.info("Succès Auth Locale pour l'utilisateur : {}", email);
                    } else {
                        log.warn("Échec Auth Locale (Mot de passe incorrect) pour : {}", email);
                    }
                    
                    return isMatch;
                })
                .orElseGet(() -> {
                    log.warn("Échec Auth Locale : Utilisateur {} introuvable en base.", email);
                    return false;
                });
    }

    /**
     * Enregistre un nouvel utilisateur avec mot de passe haché.
     */
    public void register(User user) {
        String encodedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(encodedPassword);
        userRepository.save(user);
        log.info("Nouvel utilisateur enregistré localement : {}", user.getEmail());
    }
}