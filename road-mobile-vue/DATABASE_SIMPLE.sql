-- =====================================================
-- Road Mobile Vue - Schéma SQL Simplifié
-- Tables principales: signalements, photos, notifications
-- =====================================================

-- 1. TABLE: signalements
-- =====================================================
CREATE TABLE signalements (
  id_signalement VARCHAR(36) PRIMARY KEY,
  id_utilisateur VARCHAR(36) NOT NULL,
  
  -- Description
  description TEXT NOT NULL,
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
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Statut
  id_statut ENUM(
    'EN_ATTENTE',
    'EN_TRAITEMENT',
    'TRAITE',
    'REJETE',
    'CLOTURE'
  ) DEFAULT 'EN_ATTENTE',
  
  -- Détails
  is_dirty BOOLEAN DEFAULT FALSE,
  surface DECIMAL(8, 2),
  budget DECIMAL(10, 2),
  entreprise_concerne VARCHAR(255) DEFAULT 'Non spécifiée',
  
  -- Métadonnées
  nombre_photos INT DEFAULT 0,
  
  -- Timestamps
  date_signalement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_utilisateur (id_utilisateur),
  INDEX idx_statut (id_statut),
  INDEX idx_date (date_signalement),
  INDEX idx_localisation (latitude, longitude)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. TABLE: photos
-- =====================================================
CREATE TABLE photos (
  id_photo VARCHAR(36) PRIMARY KEY,
  id_signalement VARCHAR(36) NOT NULL,
  
  -- Métadonnées
  url_stockage VARCHAR(500) NOT NULL,
  nom_fichier VARCHAR(255),
  
  -- Timestamps
  date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT FOREIGN KEY (id_signalement)
    REFERENCES signalements(id_signalement) ON DELETE CASCADE,
  
  INDEX idx_signalement (id_signalement),
  INDEX idx_date (date_ajout)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. TABLE: notifications
-- =====================================================
CREATE TABLE notifications (
  id_notification VARCHAR(36) PRIMARY KEY,
  id_signalement VARCHAR(36) NOT NULL,
  id_utilisateur VARCHAR(36) NOT NULL,
  
  -- Contenu
  message TEXT NOT NULL,
  statut VARCHAR(50),
  
  -- État
  est_lue BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT FOREIGN KEY (id_signalement)
    REFERENCES signalements(id_signalement) ON DELETE CASCADE,
  
  INDEX idx_utilisateur (id_utilisateur),
  INDEX idx_date (date_creation),
  INDEX idx_lu (est_lue)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
