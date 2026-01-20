package com.authentification.authentification.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import org.springframework.stereotype.Service;

@Service
public class FirebaseAuthService {

    public boolean authenticate(String email, String password) {
        try {
            // Dans un flux réel, on reçoit un ID Token du front.
            // Ici, on vérifie si l'utilisateur existe dans Firebase pour l'exemple.
            UserRecord userRecord = FirebaseAuth.getInstance().getUserByEmail(email);
            return userRecord != null; 
        } catch (Exception e) {
            return false;
        }
    }
}