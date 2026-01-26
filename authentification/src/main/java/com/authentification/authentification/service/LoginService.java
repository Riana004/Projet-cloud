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
            System.out.println("en ligne : tentative Firebase");
            // Tentative via Firebase
            isAuthenticated = firebaseAuth.authenticate(email, password);
            
            if (isAuthenticated) {
                System.out.println("Authentification Firebase réussie pour " + email);
                // LOGIQUE DE RÉCONCILIATION
                // Puisque l'auth Firebase a réussi, on synchronise le mot de passe en local
                reconcileLocalPassword(email, password);
            }
        } else {
            System.out.println("hors ligne : tentative locale");
            // Tentative via Postgres (Mode Offline)
            isAuthenticated = localAuth.authenticate(email, password);
        }

        // 3. Gestion des compteurs de sécurité
        if (isAuthenticated) {
            System.out.println("Authentification réussie pour " + email);
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
    if (password == null || password.isBlank()) {
        throw new IllegalArgumentException("Impossible de créer l'utilisateur local sans mot de passe");
    }

    userRepository.findByEmail(email).ifPresentOrElse(
        user -> {
            user.setPassword(passwordEncoder.encode(password));
            userRepository.save(user);
        },
        () -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setPassword(passwordEncoder.encode(password));
            newUser.setFailedAttempts(0);
            newUser.setBlocked(false);
            userRepository.save(newUser);
        }
    );
}


}