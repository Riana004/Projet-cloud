package com.authentification.authentification.service;

import com.authentification.authentification.entity.User;
import com.authentification.authentification.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LoginService {

    private final LocalAuthService localAuth;
    private final FirebaseAuthService firebaseAuth;
    private final AuthService securityService;
    private final ConnectivityService connectivity;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public String login(String email, String password) {
        // 1. Check sécurité locale (Postgres)
        if (securityService.isUserLocallyBlocked(email)) {
            throw new RuntimeException("Compte bloqué. Trop de tentatives infructueuses.");
        }

        boolean online = connectivity.isOnline();
        boolean isAuthenticated;

        if (online) {
            // Tentative via Firebase
            isAuthenticated = firebaseAuth.authenticate(email, password);
            
            if (isAuthenticated) {
                // LOGIQUE DE RÉCONCILIATION
                // Puisque l'auth Firebase a réussi, on synchronise le mot de passe en local
                reconcileLocalPassword(email, password);
            }
        } else {
            // Tentative via Postgres (Mode Offline)
            isAuthenticated = localAuth.authenticate(email, password);
        }

        // 3. Gestion des compteurs de sécurité
        if (isAuthenticated) {
            securityService.resetAttempts(email);
            return "Connexion réussie (" + (online ? "Online" : "Offline") + ")";
        } else {
            securityService.handleFailedLogin(email);
            throw new RuntimeException("Identifiants incorrects.");
        }
    }

    /**
     * Met à jour ou crée l'utilisateur localement avec le mot de passe validé par Firebase.
     */
    private void reconcileLocalPassword(String email, String password) {
        userRepository.findByEmail(email).ifPresentOrElse(
            user -> {
                // Si l'utilisateur existe déjà, on met à jour son mot de passe haché
                // Cela règle le problème si le MDP a été changé sur un autre appareil
                user.setPassword(passwordEncoder.encode(password));
                userRepository.save(user);
                System.out.println("Réconciliation : MDP local mis à jour pour " + email);
            },
            () -> {
                // Si l'utilisateur n'existait pas du tout en local (nouvel utilisateur Firebase)
                User newUser = User.builder()
                        .email(email)
                        .password(passwordEncoder.encode(password))
                        .failedAttempts(0)
                        .isBlocked(false)
                        .build();
                userRepository.save(newUser);
                System.out.println("Réconciliation : Nouvel utilisateur créé localement pour " + email);
            }
        );
    }
}