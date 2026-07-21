-- ═══════════════════════════════════════════════════════════════════════════════
-- 018 — Durcissement RLS sur diagnostics (audit approfondi carnet médical 2026-07-21)
--
-- HIGH : diagnostics_select_patient ne filtre pas sur validation_status,
-- contrairement à diagnostics_select_shared_carnet qui est bornée à
-- 'validated'. Un patient authentifié peut lire ses propres diagnostics en
-- brouillon/attente de validation via le client Supabase anon key exposé
-- côté navigateur (bypass des server actions), incluant des hypothèses IA
-- non validées et des notes cliniques internes.
--
-- Complément : diagnostics_manage_staff est FOR ALL sans restriction de rôle
-- ni sur les colonnes modifiées. N'importe quel receptionist/assistant peut,
-- via le même bypass, appeler directement l'API REST et passer
-- validation_status à 'validated' avec un validated_by arbitraire — ce qui
-- contournerait entièrement la vérification de rôle ajoutée à
-- validateDiagnostic() (migration 014). Un trigger réplique cette même règle
-- au niveau base de données.
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "diagnostics_select_patient" ON diagnostics;
CREATE POLICY "diagnostics_select_patient" ON diagnostics FOR SELECT
  USING (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
    AND validation_status = 'validated'
  );

CREATE OR REPLACE FUNCTION enforce_diagnostic_validation_role() RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.validation_status IS DISTINCT FROM OLD.validation_status
     AND NEW.validation_status IN ('validated', 'rejected')
     AND get_user_role() NOT IN ('owner', 'super_admin') THEN
    RAISE EXCEPTION 'validation_requires_medical_role';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_diagnostic_validation_role ON diagnostics;
CREATE TRIGGER trg_enforce_diagnostic_validation_role
  BEFORE UPDATE ON diagnostics
  FOR EACH ROW EXECUTE FUNCTION enforce_diagnostic_validation_role();
