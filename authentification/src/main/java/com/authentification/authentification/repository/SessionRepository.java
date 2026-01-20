package com.authentification.authentification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.authentification.authentification.entity.Session;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {
    
    Optional<Session> findByToken(String token);

    @Transactional
    void deleteByExpiresAtBefore(LocalDateTime now);
}