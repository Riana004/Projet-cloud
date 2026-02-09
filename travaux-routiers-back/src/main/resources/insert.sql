-- Roles
INSERT INTO roles (description, is_dirty, updated_at)
VALUES
('Administrateur', false, NOW()),
('Technicien', false, NOW()),
('Utilisateur', false, NOW());

-- Users
INSERT INTO users (email, password, role_id, is_dirty, updated_at)
VALUES
('admin@example.com', 'password123', 1, false, NOW()),
('tech@example.com', 'techpass', 2, false, NOW()),
('user1@example.com', 'userpass1', 3, false, NOW()),
('user2@example.com', 'userpass2', 3, false, NOW());

INSERT INTO users (email, password, role_id, is_dirty, updated_at)
VALUES
('elia@gmail.com', 'eliatest', 1, false, NOW());
-- StatutSignalement
INSERT INTO statut_signallement (statut, is_dirty, updated_at)
VALUES
('Nouveau', false, NOW()),
('En cours', false, NOW()),
('Résolu', false, NOW()),
('Rejeté', false, NOW());

-- Signalement
INSERT INTO signalement (
    id_utilisateur, description, date_signalement, latitude, longitude, 
    id_statut, is_dirty, updated_at, surface, budget, entreprise_concerne
)
VALUES
('user1@example.com', 'Fissure importante sur le mur nord', NOW(), -18.8792, 47.5079, 1, false, NOW(), 25.5, 1500.0, 'Entreprise A'),
('user2@example.com', 'Problème de plomberie dans la cuisine', NOW() - INTERVAL '2 days', -18.8800, 47.5085, 2, false, NOW(), 15.0, 800.0, 'Entreprise B'),
('user1@example.com', 'Éclairage défectueux dans le hall', NOW() - INTERVAL '5 days', -18.8820, 47.5090, 1, false, NOW(), 50.0, 1200.0, 'Entreprise C'),
('tech@example.com', 'Toit qui fuit après la pluie', NOW() - INTERVAL '1 days', -18.8830, 47.5100, 3, false, NOW(), 80.0, 5000.0, 'Entreprise D');

UPDATE statut_signallement SET pourcentage = 0 WHERE id = 1;
UPDATE statut_signallement SET pourcentage = 50 WHERE id = 2;
UPDATE statut_signallement SET pourcentage = 100 WHERE id = 3;
UPDATE statut_signallement SET pourcentage = 0 WHERE id = 4;
