-- ═══════════════════════════════════════════════════════════════════════════════
-- 014 — Journalisation des imports de carnet et rotation du code porteur
--        (audit signature / carnet / ordonnance 2026-08-02)
--
-- Le code `CAR-XXXXXXXXXXXXXXXX` est un jeton porteur : quiconque le détient peut,
-- via `importPatientCarnet`, rattacher le patient à sa clinique et lire tout
-- l'historique médical validé inter-cliniques. Deux manques en découlaient :
--
--   1. Aucune trace. Impossible de répondre à « quelles cliniques ont accédé à
--      mon dossier, et quand ? » — question à laquelle un patient a le droit
--      d'obtenir une réponse (RGPD, droit d'accès aux destinataires).
--   2. Aucune révocation. Un code divulgué le restait définitivement, puisque
--      rien ne permettait d'en générer un nouveau.
--
-- On ajoute donc un journal des imports, lisible par le patient concerné, et la
-- possibilité de faire tourner le code.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Journal des imports ───────────────────────────────────────────────────────
-- `carnet_id` et non le code lui-même : journaliser un jeton porteur reviendrait
-- à le dupliquer dans une table de plus.
CREATE TABLE IF NOT EXISTS carnet_import_events (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  carnet_id          UUID        NOT NULL REFERENCES patient_carnets(id) ON DELETE CASCADE,
  clinic_id          UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  imported_by_user_id UUID       REFERENCES users(id) ON DELETE SET NULL,
  patient_id         UUID        REFERENCES patients(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carnet_import_events_carnet ON carnet_import_events (carnet_id, created_at DESC);

ALTER TABLE carnet_import_events ENABLE ROW LEVEL SECURITY;

-- Le patient voit qui a importé son carnet : c'est l'intérêt principal du journal.
CREATE POLICY "carnet_import_events_select_patient" ON carnet_import_events FOR SELECT
USING (
  carnet_id IN (
    SELECT carnet_id FROM patients WHERE auth_user_id = auth.uid()
  )
);

-- Une clinique voit ses propres imports, pour justifier de son accès — mais
-- seulement par ses rôles médicaux. La liste des cabinets ayant consulté un
-- dossier est elle-même une donnée de santé : l'ouvrir à receptionist/assistant
-- contournerait le contrôle déjà appliqué par getCarnetImportHistory.
CREATE POLICY "carnet_import_events_select_clinic" ON carnet_import_events FOR SELECT
USING (
  clinic_id IN (
    SELECT clinic_id FROM users
    WHERE id = auth.uid() AND role IN ('owner', 'super_admin')
  )
);

-- Aucune policy d'INSERT, d'UPDATE ni de DELETE : l'écriture passe exclusivement
-- par le client d'administration depuis `importPatientCarnet`. Un journal que son
-- sujet peut réécrire ou effacer ne vaut rien.

-- ── Rotation du code porteur ──────────────────────────────────────────────────
-- Même format et même garantie d'unicité que le trigger de la migration 004.
-- SECURITY DEFINER : l'appelant n'a aucun droit d'UPDATE sur patient_carnets, et
-- ne doit pas en obtenir — l'autorisation est vérifiée côté Server Action.
CREATE OR REPLACE FUNCTION rotate_patient_carnet_code(p_carnet_id UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  success BOOLEAN := FALSE;
BEGIN
  WHILE NOT success LOOP
    new_code := 'CAR-' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 16));
    BEGIN
      UPDATE patient_carnets SET public_code = new_code WHERE id = p_carnet_id;
      -- Un UPDATE sans correspondance ne lève rien : sans ce contrôle, la
      -- fonction renverrait un code et l'appelant annoncerait une rotation
      -- réussie alors que rien n'aurait changé en base.
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Carnet % introuvable', p_carnet_id USING ERRCODE = 'no_data_found';
      END IF;
      success := TRUE;
    EXCEPTION WHEN unique_violation THEN
      -- collision improbable sur 64 bits : on retente avec un nouvel UUID
    END;
  END LOOP;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- La fonction n'est jamais appelée directement depuis le navigateur : seul le
-- rôle de service l'exécute, après contrôle applicatif.
REVOKE ALL ON FUNCTION rotate_patient_carnet_code(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION rotate_patient_carnet_code(UUID) FROM anon;
REVOKE ALL ON FUNCTION rotate_patient_carnet_code(UUID) FROM authenticated;
