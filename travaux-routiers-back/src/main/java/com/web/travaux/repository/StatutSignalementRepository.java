package com.web.travaux.repository;


import org.springframework.data.jpa.repository.JpaRepository;
<<<<<<< HEAD
import org.springframework.stereotype.Repository;

import com.web.travaux.entity.StatutSignalement;
=======
>>>>>>> 31cc15c9a79236d8b32735cc960b5a8b3e3642a7
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

<<<<<<< HEAD
=======
import com.web.travaux.entity.StatutSignalement;
>>>>>>> 31cc15c9a79236d8b32735cc960b5a8b3e3642a7

import java.util.Optional;

@Repository
public interface StatutSignalementRepository extends JpaRepository<StatutSignalement, Long> {
<<<<<<< HEAD
    StatutSignalement findByStatut(String statut);    
=======
    
    StatutSignalement findByStatut(String statut);
>>>>>>> 31cc15c9a79236d8b32735cc960b5a8b3e3642a7
}
