package com.authentification.authentification.controller;

import com.authentification.authentification.dto.LoginRequest;
import com.authentification.authentification.dto.UserDTO;
import com.authentification.authentification.service.AuthService;
import com.authentification.authentification.service.LoginService;
import com.authentification.authentification.service.RegistrationService;
import com.authentification.authentification.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final LoginService loginService;
    private final RegistrationService registrationService;
    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register")
    @Operation(summary = "Inscription initiale")
    public ResponseEntity<String> register(@RequestBody LoginRequest request) {
        try {
            if (request.getPassword() == null || request.getPassword().isBlank()) {
                return ResponseEntity.badRequest().body("Le mot de passe ne peut pas être vide.");
            }
            registrationService.register(request.getEmail(), request.getPassword());
            return ResponseEntity.ok("Utilisateur créé avec succès sur Firebase et en local.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur lors de l'inscription : " + e.getMessage());
        }
    }

    // ✅ LOGIN
   @PostMapping("/login-firebase")
    public ResponseEntity<String> login(@RequestBody LoginRequest loginRequest) {
        System.out.println("Login request: email=" + loginRequest.getEmail() + ", password=" + loginRequest.getPassword());
        try {
            String result = loginService.login(loginRequest.getEmail(), loginRequest.getPassword());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @GetMapping("/blocked")
    public List<UserDTO> getBlockedUsers() {
        return userService.getBlockedUsers();
    }

    // ✅ Débloquer un compte
    @PatchMapping("/unlock/{userId}")
    @Operation(summary = "Débloquer un compte")
    public ResponseEntity<String> unlock(@PathVariable Long userId) {
        authService.unlockUser(userId);
        return ResponseEntity.ok("Le compte utilisateur a été débloqué.");
    }

    // ✅ Changer mot de passe
    @PutMapping("/update-password")
    public ResponseEntity<String> updatePassword(@RequestParam Long userId, @RequestParam String newPassword) {
        try {
            if (newPassword == null || newPassword.isBlank()) {
                return ResponseEntity.badRequest().body("Le nouveau mot de passe ne peut pas être vide.");
            }
            userService.updatePassword(userId, newPassword);
            return ResponseEntity.ok("Mot de passe mis à jour avec succès.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ✅ Déconnexion
    @DeleteMapping("/session/logout")
    @Operation(summary = "Déconnexion")
    public ResponseEntity<String> logout(@RequestParam String token) {
        // Ajouter logique de session si besoin
        return ResponseEntity.ok("Déconnexion réussie.");
    }
}
