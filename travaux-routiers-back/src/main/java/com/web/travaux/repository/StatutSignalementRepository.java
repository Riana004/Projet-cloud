package com.web.travaux.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.web.travaux.entity.StatutSignalement;

import java.util.Optional;

@Repository
public interface StatutSignalementRepository extends JpaRepository<StatutSignalement, Long> {
    
    StatutSignalement findByStatut(String statut);

}
