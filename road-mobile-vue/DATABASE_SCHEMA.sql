-- =====================================================
-- Road Mobile Vue - Schéma SQL Complet
-- =====================================================
-- Cette base de données supporte la gestion complète
-- des signalements routiers avec photos et notifications
-- =====================================================

-- 2. TABLE: Signalements
-- =====================================================
CREATE TABLE signalements (
  id_signalement VARCHAR(36) PRIMARY KEY COMMENT 'UUID généré',
  id_utilisateur VARCHAR(36) NOT NULL COMMENT 'UID Firebase',
  
  -- Description du problème
  description TEXT NOT NULL COMMENT 'Format: [TYPE] Description',
  type_probleme ENUM(
    'Nid de poule',
    'Feu cassé',
    'Accident',
    'Embouteillage',
    'Route bloquée',
    'Travaux',
    'Autre'
  ) NOT NULL,
  
  -- Localisation
  latitude DECIMAL(10, 8) NOT NULL COMMENT 'Position GPS latitude',
  longitude DECIMAL(11, 8) NOT NULL COMMENT 'Position GPS longitude',
  precision_gps INT COMMENT 'Précision en mètres',
  
  -- Statut
  id_statut ENUM(
    'EN_ATTENTE',
    'EN_TRAITEMENT',
    'TRAITE',
    'REJETE',
    'CLOTURE'
  ) DEFAULT 'EN_ATTENTE',
  
  -- Détails du problème
  is_dirty BOOLEAN DEFAULT FALSE COMMENT 'Route sale/endommagée',
  surface DECIMAL(8, 2) COMMENT 'Surface estimée en m²',
  budget DECIMAL(10, 2) COMMENT 'Budget estimé en €',
  entreprise_concerne VARCHAR(255) DEFAULT 'Non spécifiée',
  
  -- Métadonnées
  nombre_photos INT DEFAULT 0,
  priorite INT DEFAULT 0 COMMENT '0 = Normal, 1 = Haute, -1 = Basse',
  visibilite ENUM('PUBLIC', 'PRIVE') DEFAULT 'PUBLIC',
  
  -- Timestamps
  date_signalement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Contraintes et index
  CONSTRAINT fk_utilisateur FOREIGN KEY (id_utilisateur) 
    REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
  
  INDEX idx_utilisateur (id_utilisateur),
  INDEX idx_statut (id_statut),
  INDEX idx_date (date_signalement),
  INDEX idx_localisation (latitude, longitude),
  INDEX idx_type (type_probleme),
  FULLTEXT INDEX ft_description (description)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Signalements routiers créés par les utilisateurs';

-- 3. TABLE: Photos (Table de liaison 1:N)
-- =====================================================
CREATE TABLE photos (
  id_photo VARCHAR(36) PRIMARY KEY COMMENT 'UUID généré',
  id_signalement VARCHAR(36) NOT NULL,
  
  -- Métadonnées de la photo
  url_stockage VARCHAR(500) NOT NULL COMMENT 'Chemin Firebase Storage',
  nom_fichier VARCHAR(255),
  type_fichier VARCHAR(50) DEFAULT 'image/jpeg',
  taille_bytes INT,
  
  -- Métadonnées EXIF (optionnel)
  orientation INT COMMENT '0-8 pour rotation EXIF',
  resolution_x INT,
  resolution_y INT,
  
  -- Timestamps
  date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL COMMENT 'Soft delete',
  
  -- Contraintes et index
  CONSTRAINT fk_signalement_photo FOREIGN KEY (id_signalement)
    REFERENCES signalements(id_signalement) ON DELETE CASCADE,
  
  INDEX idx_signalement (id_signalement),
  INDEX idx_date (date_ajout),
  INDEX idx_active (date_suppression)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Photos associées aux signalements (liaison 1:N)';

-- 4. TABLE: Statuts de signalements (Master data)
-- =====================================================
CREATE TABLE statuts (
  id_statut INT PRIMARY KEY AUTO_INCREMENT,
  code_statut VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  couleur VARCHAR(10) COMMENT 'Code couleur hex (ex: #FF0000)',
  ordre_affichage INT,
  actif BOOLEAN DEFAULT TRUE,
  
  INDEX idx_code (code_statut)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Liste des statuts possibles pour un signalement';

-- 5. TABLE: Changements de statut (Audit trail)
-- =====================================================
CREATE TABLE statut_changes (
  id_change VARCHAR(36) PRIMARY KEY COMMENT 'UUID généré',
  id_signalement VARCHAR(36) NOT NULL,
  id_utilisateur VARCHAR(36),
  
  -- Détails du changement
  ancien_statut ENUM(
    'EN_ATTENTE',
    'EN_TRAITEMENT',
    'TRAITE',
    'REJETE',
    'CLOTURE'
  ),
  nouveau_statut ENUM(
    'EN_ATTENTE',
    'EN_TRAITEMENT',
    'TRAITE',
    'REJETE',
    'CLOTURE'
  ) NOT NULL,
  raison_changement TEXT COMMENT 'Raison du changement de statut',
  notes_admin TEXT,
  
  -- Timestamps
  date_changement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Contraintes et index
  CONSTRAINT fk_signalement_change FOREIGN KEY (id_signalement)
    REFERENCES signalements(id_signalement) ON DELETE CASCADE,
  CONSTRAINT fk_utilisateur_change FOREIGN KEY (id_utilisateur)
    REFERENCES utilisateurs(id_utilisateur) ON DELETE SET NULL,
  
  INDEX idx_signalement_change (id_signalement),
  INDEX idx_utilisateur_change (id_utilisateur),
  INDEX idx_date_change (date_changement)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historique des changements de statut (audit trail)';

-- 6. TABLE: Notifications
-- =====================================================
CREATE TABLE notifications (
  id_notification VARCHAR(36) PRIMARY KEY COMMENT 'UUID généré',
  id_signalement VARCHAR(36) NOT NULL,
  id_utilisateur VARCHAR(36) NOT NULL,
  
  -- Contenu
  titre VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type_notification ENUM(
    'STATUT_CHANGE',
    'PHOTO_AJOUTEE',
    'COMMENTAIRE',
    'ALERTE',
    'AUTRE'
  ) DEFAULT 'STATUT_CHANGE',
  
  nouveau_statut VARCHAR(50) COMMENT 'Le nouveau statut qui a déclenché la notification',
  
  -- État
  est_lue BOOLEAN DEFAULT FALSE,
  date_lecture TIMESTAMP NULL,
  
  -- Timestamps
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_expiration TIMESTAMP NULL COMMENT 'Date d\'archivage automatique',
  
  -- Contraintes et index
  CONSTRAINT fk_signalement_notif FOREIGN KEY (id_signalement)
    REFERENCES signalements(id_signalement) ON DELETE CASCADE,
  CONSTRAINT fk_utilisateur_notif FOREIGN KEY (id_utilisateur)
    REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
  
  INDEX idx_utilisateur_notif (id_utilisateur),
  INDEX idx_date_notif (date_creation),
  INDEX idx_lu (est_lue),
  INDEX idx_signalement_notif (id_signalement)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Notifications envoyées aux utilisateurs';

-- 7. TABLE: Préférences de notification
-- =====================================================
CREATE TABLE preferences_notifications (
  id_preference VARCHAR(36) PRIMARY KEY,
  id_utilisateur VARCHAR(36) NOT NULL UNIQUE,
  
  -- Paramètres de notification
  notifications_activees BOOLEAN DEFAULT TRUE,
  notif_changement_statut BOOLEAN DEFAULT TRUE,
  notif_photo_ajoutee BOOLEAN DEFAULT TRUE,
  notif_commentaire BOOLEAN DEFAULT TRUE,
  notif_alerte BOOLEAN DEFAULT TRUE,
  
  -- Fréquence
  frequence_email ENUM('IMMEDIATEMENT', 'QUOTIDIENNE', 'HEBDOMADAIRE', 'JAMAIS') DEFAULT 'IMMEDIATEMENT',
  
  -- Timestamps
  date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Contraintes
  CONSTRAINT fk_utilisateur_pref FOREIGN KEY (id_utilisateur)
    REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
  
  INDEX idx_utilisateur_pref (id_utilisateur)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Préférences de notification pour chaque utilisateur';

-- 8. TABLE: Tentatives de connexion (Sécurité)
-- =====================================================
CREATE TABLE login_attempts (
  id_attempt VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  
  -- Suivi
  nombre_tentatives INT DEFAULT 0,
  compte_bloque BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  derniere_tentative TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_blocage TIMESTAMP NULL,
  date_deblocage TIMESTAMP NULL,
  
  CONSTRAINT UNIQUE(email),
  INDEX idx_email_attempt (email),
  INDEX idx_bloque (compte_bloque)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Suivi des tentatives de connexion échouées';

-- 9. TABLE: Logs d'activité
-- =====================================================
CREATE TABLE activity_logs (
  id_log VARCHAR(36) PRIMARY KEY,
  id_utilisateur VARCHAR(36),
  
  -- Détails de l'action
  type_action VARCHAR(50) NOT NULL,
  entite_concernee VARCHAR(50) COMMENT 'signalement, photo, notification, etc',
  id_entite VARCHAR(36),
  
  description TEXT,
  adresse_ip VARCHAR(45),
  user_agent VARCHAR(500),
  
  -- Timestamp
  date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Index
  CONSTRAINT fk_utilisateur_log FOREIGN KEY (id_utilisateur)
    REFERENCES utilisateurs(id_utilisateur) ON DELETE SET NULL,
  
  INDEX idx_utilisateur_log (id_utilisateur),
  INDEX idx_date_log (date_action),
  INDEX idx_action (type_action)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Journalisation des activités utilisateurs';

-- =====================================================
-- VUES UTILES
-- =====================================================

-- Vue: Signalements avec stats
CREATE OR REPLACE VIEW vue_signalements_stats AS
SELECT 
  s.id_signalement,
  s.id_utilisateur,
  u.email as email_utilisateur,
  s.type_probleme,
  s.id_statut,
  s.latitude,
  s.longitude,
  s.surface,
  s.budget,
  COUNT(p.id_photo) as nombre_photos,
  COUNT(DISTINCT sc.id_change) as nombre_changements_statut,
  s.date_signalement,
  s.date_modification
FROM signalements s
LEFT JOIN utilisateurs u ON s.id_utilisateur = u.id_utilisateur
LEFT JOIN photos p ON s.id_signalement = p.id_signalement AND p.date_suppression IS NULL
LEFT JOIN statut_changes sc ON s.id_signalement = sc.id_signalement
GROUP BY s.id_signalement;

-- Vue: Notifications non lues par utilisateur
CREATE OR REPLACE VIEW vue_notifications_non_lues AS
SELECT 
  id_utilisateur,
  COUNT(*) as nombre_non_lues,
  MAX(date_creation) as derniere_notification
FROM notifications
WHERE est_lue = FALSE
GROUP BY id_utilisateur;

-- Vue: Signalements actifs (non fermés)
CREATE OR REPLACE VIEW vue_signalements_actifs AS
SELECT *
FROM signalements
WHERE id_statut IN ('EN_ATTENTE', 'EN_TRAITEMENT', 'TRAITE')
  AND id_statut != 'CLOTURE'
ORDER BY date_signalement DESC;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Mettre à jour nombre_photos quand une photo est ajoutée
DELIMITER $$
CREATE TRIGGER trg_update_photos_count_insert
AFTER INSERT ON photos
FOR EACH ROW
BEGIN
  UPDATE signalements 
  SET nombre_photos = (SELECT COUNT(*) FROM photos WHERE id_signalement = NEW.id_signalement AND date_suppression IS NULL)
  WHERE id_signalement = NEW.id_signalement;
END$$
DELIMITER ;

-- Trigger: Mettre à jour nombre_photos quand une photo est supprimée
DELIMITER $$
CREATE TRIGGER trg_update_photos_count_delete
AFTER UPDATE ON photos
FOR EACH ROW
BEGIN
  UPDATE signalements 
  SET nombre_photos = (SELECT COUNT(*) FROM photos WHERE id_signalement = NEW.id_signalement AND date_suppression IS NULL)
  WHERE id_signalement = NEW.id_signalement;
END$$
DELIMITER ;

-- Trigger: Créer automatiquement une notification quand le statut change
DELIMITER $$
CREATE TRIGGER trg_create_notification_on_status_change
AFTER UPDATE ON signalements
FOR EACH ROW
BEGIN
  IF NEW.id_statut != OLD.id_statut THEN
    INSERT INTO notifications (
      id_notification,
      id_signalement,
      id_utilisateur,
      titre,
      message,
      type_notification,
      nouveau_statut,
      date_creation
    ) VALUES (
      UUID(),
      NEW.id_signalement,
      NEW.id_utilisateur,
      CONCAT('Signalement - ', NEW.id_statut),
      CASE 
        WHEN NEW.id_statut = 'EN_TRAITEMENT' THEN 'Votre signalement est en traitement'
        WHEN NEW.id_statut = 'TRAITE' THEN 'Votre signalement a été traité'
        WHEN NEW.id_statut = 'REJETE' THEN 'Votre signalement a été rejeté'
        WHEN NEW.id_statut = 'CLOTURE' THEN 'Votre signalement est clos'
        ELSE CONCAT('Statut changé: ', NEW.id_statut)
      END,
      'STATUT_CHANGE',
      NEW.id_statut,
      NOW()
    );
  END IF;
END$$
DELIMITER ;

-- =====================================================
-- DONNÉES D'INITIALISATION
-- =====================================================

-- Insérer les statuts
INSERT INTO statuts (code_statut, description, couleur, ordre_affichage) VALUES
('EN_ATTENTE', 'En attente de traitement', '#FFC107', 1),
('EN_TRAITEMENT', 'En traitement', '#2196F3', 2),
('TRAITE', 'Traité - Problème résolu', '#4CAF50', 3),
('REJETE', 'Rejeté - Signalement invalide', '#F44336', 4),
('CLOTURE', 'Clos - Dossier archivé', '#9E9E9E', 5);

-- =====================================================
-- PROCÉDURES STOCKÉES UTILES
-- =====================================================

-- Procédure: Obtenir les signalements d'un utilisateur
DELIMITER $$
CREATE PROCEDURE sp_get_user_signalements(
  IN p_id_utilisateur VARCHAR(36)
)
BEGIN
  SELECT *
  FROM vue_signalements_stats
  WHERE id_utilisateur = p_id_utilisateur
  ORDER BY date_signalement DESC;
END$$
DELIMITER ;

-- Procédure: Obtenir les signalements proches (géolocalisation)
DELIMITER $$
CREATE PROCEDURE sp_get_nearby_signalements(
  IN p_latitude DECIMAL(10, 8),
  IN p_longitude DECIMAL(11, 8),
  IN p_distance_km INT
)
BEGIN
  SELECT *,
    (
      6371 * ACOS(
        COS(RADIANS(p_latitude)) * 
        COS(RADIANS(latitude)) * 
        COS(RADIANS(longitude) - RADIANS(p_longitude)) + 
        SIN(RADIANS(p_latitude)) * 
        SIN(RADIANS(latitude))
      )
    ) as distance_km
  FROM signalements
  WHERE (
    6371 * ACOS(
      COS(RADIANS(p_latitude)) * 
      COS(RADIANS(latitude)) * 
      COS(RADIANS(longitude) - RADIANS(p_longitude)) + 
      SIN(RADIANS(p_latitude)) * 
      SIN(RADIANS(latitude))
    )
  ) <= p_distance_km
  ORDER BY distance_km ASC;
END$$
DELIMITER ;

-- Procédure: Créer une notification
DELIMITER $$
CREATE PROCEDURE sp_create_notification(
  IN p_id_signalement VARCHAR(36),
  IN p_titre VARCHAR(255),
  IN p_message TEXT,
  IN p_type VARCHAR(50)
)
BEGIN
  DECLARE v_id_utilisateur VARCHAR(36);
  
  SELECT id_utilisateur INTO v_id_utilisateur
  FROM signalements
  WHERE id_signalement = p_id_signalement;
  
  INSERT INTO notifications (
    id_notification,
    id_signalement,
    id_utilisateur,
    titre,
    message,
    type_notification,
    date_creation
  ) VALUES (
    UUID(),
    p_id_signalement,
    v_id_utilisateur,
    p_titre,
    p_message,
    p_type,
    NOW()
  );
END$$
DELIMITER ;

-- =====================================================
-- STATS ET MONITORING
-- =====================================================

-- Requête: Nombre de signalements par statut
SELECT 
  id_statut,
  COUNT(*) as nombre
FROM signalements
GROUP BY id_statut
ORDER BY nombre DESC;

-- Requête: Signalements sans photos
SELECT 
  id_signalement,
  id_utilisateur,
  type_probleme,
  nombre_photos,
  date_signalement
FROM signalements
WHERE nombre_photos = 0
ORDER BY date_signalement DESC;

-- Requête: Top utilisateurs (plus de signalements)
SELECT 
  id_utilisateur,
  COUNT(*) as nombre_signalements,
  COUNT(DISTINCT id_signalement) as nombre_unique
FROM signalements
GROUP BY id_utilisateur
ORDER BY nombre_signalements DESC
LIMIT 10;

-- Requête: Temps moyen de traitement
SELECT 
  AVG(TIMESTAMPDIFF(HOUR, s.date_signalement, sc.date_changement)) as heures_moyennes
FROM signalements s
JOIN statut_changes sc ON s.id_signalement = sc.id_signalement
WHERE sc.nouveau_statut IN ('TRAITE', 'REJETE');

-- =====================================================
-- FIN DU SCHÉMA
-- =====================================================
-- Date: 2026-02-03
-- Version: 1.0.0
-- Application: Road Mobile Vue
-- =====================================================
