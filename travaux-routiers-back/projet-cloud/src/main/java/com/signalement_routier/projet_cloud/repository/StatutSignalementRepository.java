package com.signalementroutier.projetcloud.repository;
import com.signalementroutier.projetcloud.model.StatutSignalement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StatutSignalementRepository extends JpaRepository<StatutSignalement, Long> {}
