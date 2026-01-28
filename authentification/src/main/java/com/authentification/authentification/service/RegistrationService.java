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
        // 1. Création Local (Docker)
        User localUser = new User();
        localUser.setEmail(email);
        localUser.setPassword(passwordEncoder.encode(password));
        userRepository.save(localUser);

        // 2. Création Firebase (Cloud)
        UserRecord.CreateRequest request = new UserRecord.CreateRequest()
            .setEmail(email)
            .setPassword(password);
        FirebaseAuth.getInstance().createUser(request);
    }
}