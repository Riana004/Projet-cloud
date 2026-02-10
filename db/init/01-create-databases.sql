SELECT 'CREATE DATABASE auth_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auth_db')\gexec

SELECT 'CREATE DATABASE signalement_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'signalement_db')\gexec

\c signalement_db

CREATE TABLE IF NOT EXISTS roles (
	id BIGSERIAL PRIMARY KEY,
	description VARCHAR(255),
	is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
	id BIGSERIAL PRIMARY KEY,
	email VARCHAR(255) UNIQUE NOT NULL,
	password VARCHAR(255) NOT NULL,
	role_id BIGINT NOT NULL REFERENCES roles(id),
	is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS statut_signallement (
	id BIGSERIAL PRIMARY KEY,
	statut VARCHAR(50) NOT NULL,
	is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	pourcentage DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS signalement (
	id BIGSERIAL PRIMARY KEY,
	id_utilisateur VARCHAR(255) NOT NULL,
	description TEXT,
	date_signalement TIMESTAMP NOT NULL,
	latitude DOUBLE PRECISION NOT NULL,
	longitude DOUBLE PRECISION NOT NULL,
	id_statut BIGINT REFERENCES statut_signallement(id),
	is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	surface DOUBLE PRECISION NOT NULL,
	budget DOUBLE PRECISION NOT NULL,
	entreprise_concerne VARCHAR(255) NOT NULL,
	prix_par_m2 DOUBLE PRECISION,
	niveau INTEGER
);

CREATE TABLE IF NOT EXISTS photos (
	id BIGSERIAL PRIMARY KEY,
	url TEXT NOT NULL,
	signalement_id BIGINT NOT NULL REFERENCES signalement(id),
	is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS avancements (
	id BIGSERIAL PRIMARY KEY,
	signalement_id BIGINT NOT NULL REFERENCES signalement(id),
	ancien_statut_id BIGINT REFERENCES statut_signallement(id),
	nouveau_statut_id BIGINT NOT NULL REFERENCES statut_signallement(id),
	date_modification TIMESTAMP NOT NULL
);

INSERT INTO roles (description, is_dirty, updated_at)
VALUES
('Administrateur', false, NOW()),
('Technicien', false, NOW()),
('Utilisateur', false, NOW());

INSERT INTO users (email, password, role_id, is_dirty, updated_at)
VALUES
('elia@gmail.com', 'eliatest', 1, false, NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO statut_signallement (statut, is_dirty, updated_at)
VALUES
('Nouveau', false, NOW()),
('En cours', false, NOW()),
('Résolu', false, NOW()),
('Rejeté', false, NOW());

UPDATE statut_signallement SET pourcentage = 0 WHERE id = 1;
UPDATE statut_signallement SET pourcentage = 50 WHERE id = 2;
UPDATE statut_signallement SET pourcentage = 100 WHERE id = 3;
UPDATE statut_signallement SET pourcentage = 0 WHERE id = 4;