package com.signalementroutier.projetcloud.repository;
import com.signalementroutier.projetcloud.model.Signalement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SignalementRepository extends JpaRepository<Signalement, Long> {}