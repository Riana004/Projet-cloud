package com.web.travaux.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.web.travaux.entity.Signalement;
<<<<<<< HEAD
import com.web.travaux.entity.StatutSignalement;
=======
>>>>>>> 31cc15c9a79236d8b32735cc960b5a8b3e3642a7

import java.util.Optional;

@Repository
public interface SignalementRepository extends JpaRepository<Signalement, Long> {
<<<<<<< HEAD
    Optional<Signalement> findByIdUtilisateur(String utilisateurId);
=======
    
>>>>>>> 31cc15c9a79236d8b32735cc960b5a8b3e3642a7
}
