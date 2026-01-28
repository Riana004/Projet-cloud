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
    private final AuthService securityService; // C'est lui qui pilote Firebase + Postgres
    private final ConnectivityService connectivity;
    private final UserRepository userRepository;
<<<<<<< HEAD
    private final PasswordEncoder passwordEncoder; // Injection via l'interface

    public String login(String email, String password) {
        // 1. Check sécurité locale (Postgres)
        if (securityService.isUserBlocked(email)) {
            throw new RuntimeException("Compte bloqué. Trop de tentatives infructueuses.");
=======
    private final PasswordEncoder passwordEncoder;

    public String login(String email, String password) {
        // 1. Double Check Sécurité (Postgres + Firebase Status)
        // On utilise la nouvelle méthode globale
        if (securityService.isUserBlocked(email)) {
            throw new RuntimeException("Compte suspendu ou bloqué. Veuillez contacter le support.");
>>>>>>> 31cc15c9a79236d8b32735cc960b5a8b3e3642a7
        }

        boolean online = connectivity.isOnline();
        boolean isAuthenticated;

<<<<<<< HEAD
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
=======
        try {
            if (online) {
                // 2. Auth via Firebase
                isAuthenticated = firebaseAuth.authenticate(email, password);
                
                if (isAuthenticated) {
                    // Synchronisation du hash local
                    reconcileLocalPassword(email, password);
                }
            } else {
                // 2. Auth via Postgres (Mode Offline)
                isAuthenticated = localAuth.authenticate(email, password);
            }

            // 3. Gestion du succès
            if (isAuthenticated) {
                securityService.resetAttempts(email); // Débloque local + Firebase
                return "Connexion réussie (" + (online ? "Online" : "Offline") + ")";
            } else {
                // Cas où l'auth retourne false (rare selon ton implémentation Firebase)
                securityService.handleFailedLogin(email);
                throw new RuntimeException("Identifiants incorrects(nv).");
            }

        } catch (Exception e) {
            // 4. Gestion de l'échec (Firebase lève souvent une exception en cas de 400/401)
>>>>>>> 31cc15c9a79236d8b32735cc960b5a8b3e3642a7
            securityService.handleFailedLogin(email);
            throw new RuntimeException(e.getMessage());
        }
    }

<<<<<<< HEAD
    /**
     * Synchronise le mot de passe Firebase avec la base locale PostgreSQL.
     */
=======
>>>>>>> 31cc15c9a79236d8b32735cc960b5a8b3e3642a7
    @Transactional
    private void reconcileLocalPassword(String email, String password) {
        userRepository.findByEmail(email).ifPresentOrElse(
            user -> {
<<<<<<< HEAD
                // Mise à jour du hash local pour correspondre à la réalité Firebase
                user.setPassword(passwordEncoder.encode(password));
                user.setFailedAttempts(0); // Reset par sécurité
=======
                user.setPassword(passwordEncoder.encode(password));
                user.setFailedAttempts(0);
                user.setBlocked(false);
>>>>>>> 31cc15c9a79236d8b32735cc960b5a8b3e3642a7
                userRepository.save(user);
                System.out.println("Réconciliation : MDP local mis à jour pour " + email);
            },
            () -> {
<<<<<<< HEAD
                // Création si l'utilisateur n'existe pas encore dans le Docker
=======
>>>>>>> 31cc15c9a79236d8b32735cc960b5a8b3e3642a7
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