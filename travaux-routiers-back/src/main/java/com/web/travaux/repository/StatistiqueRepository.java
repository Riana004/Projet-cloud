package com.web.travaux.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import com.web.travaux.entity.Avancement;

@Repository
public interface StatistiqueRepository extends JpaRepository<Avancement, Long> {

    @Query("""
        SELECT 
          s.entrepriseConcerne,
          EXTRACT(EPOCH FROM (a.dateModification - s.dateSignalement)) / 3600
        FROM Avancement a
        JOIN a.signalement s
        JOIN a.nouveauStatut st
        WHERE st.statut = 'terminé'
    """)
    List<Object[]> findDelaisTermines();
}
