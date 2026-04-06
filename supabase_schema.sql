-- 1. Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Création de la table des entreprises (Tenants / Compagnies)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Création de la table des Licences SaaS (Liée aux entreprises)
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'premium', -- starter, premium, enterprise
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, EXPIRED
  max_vehicles INT DEFAULT 20,
  max_drivers INT DEFAULT 30,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Prolongement de la table des Utilisateurs Supabase Auth
-- Remarque : Cette table référence le schéma public et complète l'authentification de Supabase
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'operator', -- admin, operator, controller
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Gestion de la Flotte (Véhicules)
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  plate TEXT NOT NULL,
  model TEXT,
  capacity INT NOT NULL,
  status TEXT DEFAULT 'active', -- active, maintenance, inactive
  current_lat DECIMAL(10, 8),
  current_lng DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unicité de plaque d'immatriculation par transporteur
  UNIQUE(company_id, plate)
);

-- 6. Gestion des Chauffeurs
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  license_number TEXT,
  status TEXT DEFAULT 'active', -- active, on_leave, suspended
  rating DECIMAL(2, 1) DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Catalogue des Lignes de Transport (Routes)
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance_km DECIMAL,
  duration_min INT,
  price_fcfa INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Gestion des Trajets programmés (Trips)
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  departure_at TIMESTAMPTZ NOT NULL,
  arrival_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, delayed, cancelled
  seats_booked INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Gestion des Réservations et Billetterie (Bookings)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT,
  seat_number TEXT NOT NULL,
  qr_code TEXT UNIQUE NOT NULL, -- Identifiant digital unique
  status TEXT DEFAULT 'confirmed', -- confirmed, used, cancelled
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  checked_in_at TIMESTAMPTZ
);


-----------------------------------------
-- GESTION DE LA SÉCURITÉ : RLS (Row Level Security)
-----------------------------------------
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Politique générale : Les utilisateurs authentifiés de l'entreprise peuvent tout faire sur les données de LEUR entreprise.
-- (Remarque : Nécessite que `auth.uid()` soit lié à un utilisteur de la table `users`)

-- Fonction pour obtenir le company_id de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_current_company_id() RETURNS UUID AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Exemples de politiques RLS appliquées
CREATE POLICY "Users limit cross-tenant data for fleets" 
ON vehicles FOR ALL USING (company_id = get_current_company_id());

CREATE POLICY "Users limit cross-tenant data for routes" 
ON routes FOR ALL USING (company_id = get_current_company_id());

-- (Les administrateurs Superadmin Soutra utiliseront la clé de rôle de service "service_role" qui contourne automatiquement le RLS)

-----------------------------------------
-- DONNÉES DE TEST / DÉMO
-----------------------------------------
-- Générer une licence de démo
INSERT INTO companies (name, email, phone) 
VALUES ('UTB Transports', 'admin@utb.ci', '+225 0000000000') 
RETURNING id; 
-- Note : Il faudra récupérer cet ID pour associer manuellement la clé de licence.
