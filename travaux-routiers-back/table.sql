CREATE TABLE STATUT_SIGNALLEMENT(
    id serial primary,
    statut varchar(50) not null
);

CREATE TABLE SIGNALEMENT(
    id serial primary,
    id_utilisateur varchar(255) not null,
    description text not null,
    date_signalement timestamp not null,
    latitude double precision not null,
    longitude double precision not null,
    id_statut integer references STATUT_SIGNALLEMENT(id)
);