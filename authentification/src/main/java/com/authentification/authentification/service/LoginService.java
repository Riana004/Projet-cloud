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
    private final PasswordEncoder passwordEncoder;

    public String login(String email, String password) {
        // 1. Double Check Sécurité (Postgres + Firebase Status)
        // On utilise la nouvelle méthode globale
        if (securityService.isUserBlocked(email)) {
            throw new RuntimeException("Compte suspendu ou bloqué. Veuillez contacter le support.");
        }

        boolean online = connectivity.isOnline();
        boolean isAuthenticated;

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
            securityService.handleFailedLogin(email);
            throw new RuntimeException(e.getMessage());
        }
    }

    @Transactional
    private void reconcileLocalPassword(String email, String password) {
        userRepository.findByEmail(email).ifPresentOrElse(
            user -> {
                user.setPassword(passwordEncoder.encode(password));
                user.setFailedAttempts(0);
                user.setBlocked(false);
                userRepository.save(user);
                System.out.println("Réconciliation : MDP local mis à jour pour " + email);
            },
            () -> {
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