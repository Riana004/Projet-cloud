package com.authentification.authentification.service;

import com.authentification.authentification.entity.User;
import com.authentification.authentification.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder; // Utilise l'interface parente
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LoginService {

    private final LocalAuthService localAuth;
    private final FirebaseAuthService firebaseAuth;
    private final AuthService securityService;
    private final ConnectivityService connectivity;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // Injection via l'interface

    public String login(String email, String password) {
        // 1. Check sécurité locale (Postgres)
        if (securityService.isUserLocallyBlocked(email)) {
            throw new RuntimeException("Compte bloqué. Trop de tentatives infructueuses.");
        }

        boolean online = connectivity.isOnline();
        boolean isAuthenticated;

        if (online) {
            // 2. Tentative via Firebase (C'est lui le maître quand on a internet)
            isAuthenticated = firebaseAuth.authenticate(email, password);
            
            if (isAuthenticated) {
                // Si l'auth Firebase réussit, on synchronise le mot de passe localement
                reconcileLocalPassword(email, password);
            }
        } else {
            // 2. Tentative via Postgres (Mode Offline)
            isAuthenticated = localAuth.authenticate(email, password);
        }

        // 3. Gestion des compteurs et retour
        if (isAuthenticated) {
            securityService.resetAttempts(email);
            return "Connexion réussie (" + (online ? "Online" : "Offline") + ")";
        } else {
            // C'est ici que handleFailedLogin est appelé si l'auth échoue
            securityService.handleFailedLogin(email);
            throw new RuntimeException("Identifiants incorrects.");
        }
    }

    /**
     * Synchronise le mot de passe Firebase avec la base locale PostgreSQL.
     */
    @Transactional
    private void reconcileLocalPassword(String email, String password) {
        userRepository.findByEmail(email).ifPresentOrElse(
            user -> {
                // Mise à jour du hash local pour correspondre à la réalité Firebase
                user.setPassword(passwordEncoder.encode(password));
                user.setFailedAttempts(0); // Reset par sécurité
                userRepository.save(user);
                System.out.println("Réconciliation : MDP local mis à jour pour " + email);
            },
            () -> {
                // Création si l'utilisateur n'existe pas encore dans le Docker
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setPassword(passwordEncoder.encode(password));
                newUser.setFailedAttempts(0);
                newUser.setBlocked(false);
                userRepository.save(newUser);
                System.out.println("Réconciliation : Nouvel utilisateur créé pour " + email);
            }
        );
    }
}