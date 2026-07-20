-- ═══════════════════════════════════════════════════════════════════════════════
-- 009 — Nouveau statut 'unpaid' + calcul automatique à la création du RDV
--        (audit abonnements/paiements 2026-07-20)
--
-- CRITICAL : aucun chemin de création de RDV ne positionnait payment_status
-- selon le prix du service — la valeur restait toujours au défaut
-- 'not_required', et le dashboard patient exclut explicitement 'not_required'
-- de la condition d'affichage du bouton "Payer". Le paiement de RDV en ligne
-- était donc inatteignable dans l'UI. Il manquait un statut distinct entre
-- "aucun paiement requis" (service gratuit) et "paiement requis, pas encore
-- effectué" — c'est ce que 'unpaid' introduit.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_payment_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_payment_status_check
  CHECK (payment_status IN ('not_required', 'unpaid', 'pending', 'paid', 'refunded'));

-- Trigger BEFORE INSERT : dérive payment_status du prix du service au moment
-- de la création, quel que soit le point d'entrée (dashboard, API publique,
-- widget via create_booking_from_widget) sans dupliquer la logique partout.
CREATE OR REPLACE FUNCTION set_appointment_initial_payment_status() RETURNS TRIGGER AS $$
DECLARE
  v_price NUMERIC;
BEGIN
  -- Ne pas écraser une valeur explicitement fournie par un chemin qui gère
  -- déjà son propre statut de paiement (ex: paiement crypto/Stripe direct).
  IF NEW.payment_status IS DISTINCT FROM 'not_required' THEN
    RETURN NEW;
  END IF;

  SELECT price INTO v_price FROM services WHERE id = NEW.service_id;

  IF v_price IS NOT NULL AND v_price > 0 THEN
    NEW.payment_status := 'unpaid';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_appointment_initial_payment_status ON appointments;
CREATE TRIGGER trg_set_appointment_initial_payment_status
  BEFORE INSERT ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_appointment_initial_payment_status();
