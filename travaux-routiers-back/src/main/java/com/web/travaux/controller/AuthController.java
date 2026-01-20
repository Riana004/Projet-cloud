package com.web.travaux.controller;

import com.web.travaux.dto.LoginRequest;
import com.web.travaux.dto.LoginResponse;
import com.web.travaux.entity.User;
import com.web.travaux.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        return userRepository.findByEmail(request.getEmail())
                .map(user -> {
                    if (user.getPassword().equals(request.getPassword())) {  // ⚠️ pour test seulement, pas de mot de passe en clair en prod
                        LoginResponse response = new LoginResponse(
                                user.getId(),
                                user.getEmail(),
                                user.getRole().getDescription()   // suppose que Role a un champ "name"
                        );
                        return ResponseEntity.ok(response);
                    } else {
                        return ResponseEntity.status(401).body("Mot de passe incorrect");
                    }
                })
                .orElse(ResponseEntity.status(404).body("Utilisateur non trouvé"));
    }
}
