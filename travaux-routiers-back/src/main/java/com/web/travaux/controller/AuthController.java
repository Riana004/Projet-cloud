package com.web.travaux.controller;

import com.web.travaux.dto.LoginRequest;
import com.web.travaux.dto.LoginResponse;
import com.web.travaux.entity.Role;
import com.web.travaux.entity.User;
import com.web.travaux.repository.RoleRepository;
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
    private final RoleRepository roleRepository;
    @PostMapping("/login-role")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .map(user -> {
                    if (user.getPassword().equals(request.getPassword())) { // ⚠️ Mot de passe en clair, remplacer par BCrypt en prod
                        LoginResponse response = new LoginResponse(
                                user.getId(),
                                user.getEmail(),
                                String.valueOf(user.getRole().getId()) // on renvoie l'id du rôle
<<<<<<< HEAD
=======

>>>>>>> 31cc15c9a79236d8b32735cc960b5a8b3e3642a7
                        );
                        return ResponseEntity.ok(response);
                    } else {
                        return ResponseEntity.status(401).body("Mot de passe incorrect");
                    }
                })
                .orElse(ResponseEntity.status(404).body("Utilisateur non trouvé"));
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody LoginRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("L'email existe déjà.");
        }
        User newUser = new User();
        newUser.setEmail(request.getEmail());
        newUser.setPassword(request.getPassword());
        newUser.setDirty(false);
        newUser.setUpdatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
        Role role = roleRepository.findById(3L) 
                .orElseThrow(() -> new RuntimeException("Rôle par défaut non trouvé"));
        newUser.setRole(role);
        userRepository.save(newUser);
        return ResponseEntity.ok("Utilisateur enregistré avec succès.");    
    
    }
}
