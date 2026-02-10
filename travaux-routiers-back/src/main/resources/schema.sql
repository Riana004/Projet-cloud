-- 1. Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(100),
    is_blocked BOOLEAN DEFAULT FALSE,
    failed_attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table pour la gestion des sessions (Durée de vie)
-- Note: Si tu utilises Spring Session, cette table est gérée automatiquement, 
-- mais voici une version personnalisée pour un contrôle manuel.
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table de configuration (pour rendre la limite paramétrable)
CREATE TABLE IF NOT EXISTS app_config (
    config_key VARCHAR(50) PRIMARY KEY,
    config_value INTEGER NOT NULL
);

-- Insertion de la limite par défaut (3 tentatives)
INSERT INTO app_config (config_key, config_value) 
VALUES ('max_login_attempts', 3)
ON CONFLICT (config_key) DO NOTHING;

---
-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

ALTER TABLE public.signalement
ALTER COLUMN budget DROP NOT NULL,
ALTER COLUMN date_signalement DROP NOT NULL,
ALTER COLUMN description DROP NOT NULL,
ALTER COLUMN entreprise_concerne DROP NOT NULL,
ALTER COLUMN id_utilisateur DROP NOT NULL,
ALTER COLUMN is_dirty DROP NOT NULL,
ALTER COLUMN latitude DROP NOT NULL,
ALTER COLUMN longitude DROP NOT NULL,
ALTER COLUMN surface DROP NOT NULL,
ALTER COLUMN updated_at DROP NOT NULL;
