
CREATE TABLE IF NOT EXISTS signalements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Firestore doc id
  id_utilisateur UUID REFERENCES users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  date_signalement TIMESTAMP WITH TIME ZONE DEFAULT now(),
  latitude DOUBLE PRECISION NOT NULL DEFAULT 0,
  longitude DOUBLE PRECISION NOT NULL DEFAULT 0,
  surface NUMERIC DEFAULT 0,
  budget NUMERIC DEFAULT 0,
  entreprise_concerne VARCHAR(255) DEFAULT '',
  id_statut VARCHAR(50) DEFAULT 'EN_ATTENTE',
  statut VARCHAR(50) DEFAULT 'EN_ATTENTE',
  is_dirty BOOLEAN DEFAULT false,
  photos_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_signalements_user ON signalements (id_utilisateur);
CREATE INDEX IF NOT EXISTS idx_signalements_statut ON signalements (id_statut);


CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
  id_signalement UUID REFERENCES signalements(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  date_ajout TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_photos_signalement ON photos (id_signalement);


CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signalement_id UUID REFERENCES signalements(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  statut VARCHAR(50),
  message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_read BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id);

CREATE TABLE IF NOT EXISTS statut_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signalement_id UUID REFERENCES signalements(id) ON DELETE CASCADE,
  ancien_statut VARCHAR(50),
  nouveau_statut VARCHAR(50),
  date_changement TIMESTAMP WITH TIME ZONE DEFAULT now(),
  raison TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_statut_changes_signalement ON statut_changes (signalement_id);

