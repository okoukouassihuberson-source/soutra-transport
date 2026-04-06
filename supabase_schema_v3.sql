---------------------------------------------------------
-- MIGRATION V3 - Colonnes Légales + Abonnés Mensuels
---------------------------------------------------------

-- 1. Ajout des colonnes légales manquantes dans la table companies
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS rccm TEXT,
ADD COLUMN IF NOT EXISTS ncc TEXT;

-- 2. Table complète des Abonnés Mensuels (Passagers Réguliers / B2B)
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  card_number TEXT UNIQUE NOT NULL,    -- Ex: AB-204
  full_name TEXT NOT NULL,
  phone TEXT,
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  monthly_price_fcfa INT NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'active',        -- active, expired, cancelled
  subscribed_at DATE DEFAULT CURRENT_DATE,
  expires_at DATE NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subscribers multi-tenant isolation"
ON subscribers FOR ALL USING (company_id = get_current_company_id());

-- 3. Création du Bucket Supabase Storage pour les logos (à faire dans le dashboard Supabase aussi)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true);

-- 4. Vue SQL agrégée pour le Dashboard (Statistiques temps réel par compagnie)
CREATE OR REPLACE VIEW company_daily_stats AS
SELECT
  b.company_id,
  DATE(b.booked_at) AS sale_date,
  COUNT(*) AS total_tickets,
  SUM(b.price_ticket) AS total_revenue,
  SUM(CASE WHEN b.payment_method = 'Espèces' THEN b.price_ticket ELSE 0 END) AS cash_revenue,
  SUM(CASE WHEN b.payment_method != 'Espèces' THEN b.price_ticket ELSE 0 END) AS mobile_revenue,
  COUNT(CASE WHEN b.is_fraud_flag = TRUE THEN 1 END) AS fraud_alerts,
  COUNT(CASE WHEN b.payment_method = 'Wave' THEN 1 END) AS wave_count,
  COUNT(CASE WHEN b.payment_method = 'Orange Money' THEN 1 END) AS orange_count,
  COUNT(CASE WHEN b.payment_method = 'MTN MoMo' THEN 1 END) AS mtn_count
FROM bookings b
GROUP BY b.company_id, DATE(b.booked_at);

-- 5. View - Classement des cars les plus rentables
CREATE OR REPLACE VIEW vehicle_revenue_ranking AS
SELECT
  v.id AS vehicle_id,
  v.plate,
  v.model,
  v.company_id,
  COUNT(b.id) AS total_tickets,
  SUM(b.price_ticket) AS total_revenue
FROM vehicles v
LEFT JOIN trips t ON t.vehicle_id = v.id
LEFT JOIN bookings b ON b.trip_id = t.id
GROUP BY v.id, v.plate, v.model, v.company_id
ORDER BY total_revenue DESC NULLS LAST;
