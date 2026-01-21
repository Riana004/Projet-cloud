package com.authentification.authentification.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.authentification.authentification.entity.User;
import com.authentification.authentification.repository.UserRepository;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RegistrationService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

        public void register(String email, String password) throws Exception {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            throw new IllegalArgumentException("Email et mot de passe ne peuvent pas être vides");
        }

        // 1️⃣ Création Firebase d'abord
        UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                .setEmail(email)
                .setPassword(password);
        FirebaseAuth.getInstance().createUser(request);

        // 2️⃣ Création locale PostgreSQL
        User localUser = new User();
        localUser.setEmail(email);
        localUser.setPassword(passwordEncoder.encode(password)); // 🔹 encodage obligatoire
        localUser.setFailedAttempts(0);   // 🔹 initialisation
        localUser.setBlocked(false);    // 🔹 initialisation
        userRepository.save(localUser);
    }
}
