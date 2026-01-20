package com.authentification.authentification.service;

import com.authentification.authentification.entity.Session;
import com.authentification.authentification.entity.User;
import com.authentification.authentification.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;

    public Session createSession(User user, int durationMinutes) {
        Session session = new Session();
        session.setUser(user);
        session.setToken(UUID.randomUUID().toString());
        session.setExpiresAt(LocalDateTime.now().plusMinutes(durationMinutes));
        return sessionRepository.save(session);
    }

    public boolean isSessionValid(String token) {
        return sessionRepository.findByToken(token)
                .map(session -> session.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElse(false);
    }

    public void logout(String token) {
        sessionRepository.findByToken(token).ifPresent(sessionRepository::delete);
    }
}