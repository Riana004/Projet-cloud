package com.web.travaux.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import com.web.travaux.entity.Avancement;
import java.util.List;

@Repository
public interface StatistiqueRepository extends JpaRepository<Avancement, Long> {

    @Query(value = """
        SELECT 
            s.entreprise_concerne,
            EXTRACT(EPOCH FROM (a.date_modification - s.date_signalement)) / 3600 AS delai
        FROM avancements a
        JOIN signalement s ON s.id = a.signalement_id
        JOIN statut_signallement st ON st.id = a.nouveau_statut_id
        WHERE st.statut = 'Résolu'
        """, nativeQuery = true)
    List<Object[]> findDelaisTermines();
}
