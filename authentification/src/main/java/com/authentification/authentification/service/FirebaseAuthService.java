package com.authentification.authentification.service;

import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Service
public class FirebaseAuthService {

    @Value("${firebase.api.key}")
    private String firebaseApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean authenticate(String email, String password) {
        String url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + firebaseApiKey;
        Map<String, Object> body = new HashMap<>();
        body.put("email", email);
        body.put("password", password);
        body.put("returnSecureToken", true);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, body, Map.class);
            
            // On vérifie la présence du token de session Firebase
            if (response.getBody() != null && response.getBody().containsKey("idToken")) {
                System.out.println(">>> FIREBASE OK : Token reçu pour " + email);
                return true;
            }
        } catch (Exception e) {
            // En cas de mauvais mot de passe, Google renvoie une erreur 400 qui tombe ici
            System.err.println(">>> FIREBASE REJETÉ : Mauvais mot de passe ou utilisateur inconnu");
            return false;
        }
        return false;
    }
}