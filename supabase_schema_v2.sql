---------------------------------------------------------
-- MIGRATION V2 - SaaS Transport (Module Fonctionnel Ivoirien)
---------------------------------------------------------

-- 1. Ajout des Convoyeurs / Convoyeuses
CREATE TABLE conductors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- active, off, suspended
  rating DECIMAL(2, 1) DEFAULT 5.0, -- Score de performance
  total_revenue_generated INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Mise à jour de la table trips (Trajets)
ALTER TABLE trips 
ADD COLUMN conductor_id UUID REFERENCES conductors(id) ON DELETE SET NULL,
ADD COLUMN revenue_expected INT DEFAULT 0,
ADD COLUMN regular_score DECIMAL(4, 1) DEFAULT 100.0; -- Ex: Ponctualité de démarrage

-- 3. Mise à jour de la table Bookings (Tickets vendus en Guichet/Mobile)
ALTER TABLE bookings
ADD COLUMN price_ticket INT NOT NULL DEFAULT 0,
ADD COLUMN payment_method TEXT CHECK (payment_method IN ('Espèces', 'Wave', 'Orange Money', 'MTN MoMo', 'Moov Money')) DEFAULT 'Espèces',
ADD COLUMN amount_received INT DEFAULT 0, -- Saisi par le guichetier/convoyeur
ADD COLUMN change_returned INT DEFAULT 0, -- Calculé par sécurité (amount_received - price_ticket)
ADD COLUMN conductor_id UUID REFERENCES conductors(id) ON DELETE SET NULL,
ADD COLUMN is_fraud_flag BOOLEAN DEFAULT FALSE; -- True si inchoérence mathématique ou forçage

-- 4. Suivi des Caisse (Clôtures journalières par convoyeur/guichetier)
CREATE TABLE cash_closures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  conductor_id UUID REFERENCES conductors(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Le guichetier éventuel
  date_closure DATE NOT NULL DEFAULT CURRENT_DATE,
  total_system_expected INT NOT NULL DEFAULT 0, -- Calculé localement (Espèces)
  total_declared_cash INT NOT NULL DEFAULT 0, -- Saisi physique par l'agent
  discrepancy_amount INT DEFAULT 0, -- total_declared_cash - total_system_expected (Si négatif = Manquant)
  total_mobile_money INT NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending_review', -- pending_review, validated, disputed
  closed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, conductor_id, date_closure)
);

-- 5. Scores & Performance (Historique Analytics)
CREATE TABLE performance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL, -- 'driver', 'conductor', 'vehicle'
  entity_id UUID NOT NULL,
  score_modifier DECIMAL, -- ex: +0.2 ou -1.5
  reason TEXT NOT NULL, -- ex: "Retard de 30min", "Caisse parfaite", "Manquant de 500FCFA"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation RLS sur les nouvelles tables
ALTER TABLE conductors ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users limit cross-tenant data for conductors" 
ON conductors FOR ALL USING (company_id = get_current_company_id());

CREATE POLICY "Users limit cross-tenant data for cash_closures" 
ON cash_closures FOR ALL USING (company_id = get_current_company_id());

CREATE POLICY "Users limit cross-tenant data for performance" 
ON performance_logs FOR ALL USING (company_id = get_current_company_id());
