CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    description VARCHAR(255),
    is_dirty BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: STATUT_SIGNALLEMENT (attention au nom avec double L)
CREATE TABLE statut_signallement (
    id BIGSERIAL PRIMARY KEY,
    statut VARCHAR(50) NOT NULL,
    is_dirty BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: users_details
CREATE TABLE users_details (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id BIGINT NOT NULL,
    is_dirty BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) 
        REFERENCES roles(id) ON DELETE RESTRICT
);

-- Table: SIGNALEMENT
CREATE TABLE signalement (
    id BIGSERIAL PRIMARY KEY,
    id_utilisateur VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date_signalement TIMESTAMP NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    id_statut BIGINT,
    is_dirty BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    surface DOUBLE PRECISION NOT NULL,
    budget DOUBLE PRECISION NOT NULL,
    entreprise_concerne VARCHAR(255) NOT NULL,
    
    CONSTRAINT fk_signalement_statut FOREIGN KEY (id_statut) 
        REFERENCES statut_signallement(id) ON DELETE SET NULL
);
