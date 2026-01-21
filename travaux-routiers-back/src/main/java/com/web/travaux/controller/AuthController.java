package com.web.travaux.controller;

import com.web.travaux.dto.LoginRequest;
import com.web.travaux.dto.LoginResponse;
import com.web.travaux.entity.User;
import com.web.travaux.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;

    @PostMapping("/login-role")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .map(user -> {
                    if (user.getPassword().equals(request.getPassword())) { // ⚠️ Mot de passe en clair, remplacer par BCrypt en prod
                        LoginResponse response = new LoginResponse(
                                user.getId(),
                                user.getEmail(),
                                String.valueOf(user.getRole().getId()) // on renvoie l'id du rôle

                        );
                        return ResponseEntity.ok(response);
                    } else {
                        return ResponseEntity.status(401).body("Mot de passe incorrect");
                    }
                })
                .orElse(ResponseEntity.status(404).body("Utilisateur non trouvé"));
    }
}
