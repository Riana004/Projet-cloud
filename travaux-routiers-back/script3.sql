-- =========================
-- TABLE ROLES
-- =========================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (description) VALUES
('VISITEUR'),
('MANAGER');

-- =========================
-- TABLE USERS
-- =========================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(id),
    is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Exemple utilisateurs
INSERT INTO users (email, password, role_id)
VALUES
('manager@mail.com', 'admin123', 2),
('user@mail.com', 'user123', 1);

-- =========================
-- TABLE STATUT SIGNALEMENT
-- =========================
CREATE TABLE statut_signallement (
    id SERIAL PRIMARY KEY,
    statut VARCHAR(50) NOT NULL,
    pourcentage INT NOT NULL,
    is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO statut_signallement (statut, pourcentage)
VALUES
('NOUVEAU', 0),
('EN_COURS', 50),
('TERMINE', 100);

-- =========================
-- TABLE SIGNALEMENT
-- =========================
CREATE TABLE signalement (
    id SERIAL PRIMARY KEY,
    id_utilisateur VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date_signalement TIMESTAMP NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    id_statut INT REFERENCES statut_signallement(id),
    surface DOUBLE PRECISION NOT NULL,
    budget DOUBLE PRECISION NOT NULL,
    entreprise_concerne VARCHAR(255) NOT NULL,
    is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABLE PHOTOS
-- =========================
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    signalement_id INT NOT NULL REFERENCES signalement(id) ON DELETE CASCADE,
    is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABLE AVANCEMENTS (historique)
-- =========================
CREATE TABLE avancements (
    id SERIAL PRIMARY KEY,
    signalement_id INT NOT NULL REFERENCES signalement(id),
    ancien_statut_id INT REFERENCES statut_signallement(id),
    nouveau_statut_id INT NOT NULL REFERENCES statut_signallement(id),
    date_modification TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
