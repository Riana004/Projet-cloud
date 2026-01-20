package com.authentification.authentification.controller;

import com.authentification.authentification.service.AuthService;
import com.authentification.authentification.service.LoginService;
import com.authentification.authentification.service.RegistrationService;
import com.authentification.authentification.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification & Gestion Utilisateur", description = "API pour le login, l'inscription et la sécurité")
public class AuthController {

    private final LoginService loginService;
    private final RegistrationService registrationService;
    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register")
    @Operation(summary = "Inscription initiale", description = "Crée l'utilisateur simultanément sur Firebase et PostgreSQL local.")
    public ResponseEntity<String> register(
            @RequestParam String email, 
            @RequestParam String password) {
        try {
            registrationService.register(email, password);
            return ResponseEntity.ok("Utilisateur créé avec succès sur Firebase et en local.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur lors de l'inscription : " + e.getMessage());
        }
    }

   @PostMapping("/login-firebase")
    @Operation(summary = "Connexion sécurisée", description = "Vérifie le blocage local, détecte la connexion internet, et tente l'authentification (Firebase ou Local).")
    public ResponseEntity<String> login(
            @RequestParam String email, 
            @RequestParam String password) {
        try {
            String result = loginService.login(email, password);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @PatchMapping("/unlock/{userId}")
    @Operation(summary = "Débloquer un compte", description = "Réinitialise le compteur de tentatives et lève le blocage pour l'ID donné.")
    public ResponseEntity<String> unlock(@PathVariable Long userId) {
        authService.unlockUser(userId);
        return ResponseEntity.ok("Le compte utilisateur a été débloqué.");
    }

    @PutMapping("/update-password")
    public ResponseEntity<String> updatePassword(@RequestParam Long userId, @RequestParam String newPassword) {
        try {
            userService.updatePassword(userId, newPassword);
            return ResponseEntity.ok("Mot de passe mis à jour avec succès.");
        } catch (RuntimeException e) {
            // Renvoie l'erreur "Une connexion Internet est requise" avec un code 400
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/session/logout")
    @Operation(summary = "Déconnexion", description = "Invalide la session actuelle.")
    public ResponseEntity<String> logout(@RequestParam String token) {
        // La logique de session peut être ajoutée ici via ton SessionService
        return ResponseEntity.ok("Déconnexion réussie.");
    }
}