-- ═══════════════════════════════════════════════════════════════════════════════
-- 017 — Verrouille l'imputabilité des diagnostics scellés
--        (audit complet 2026-08-23 — tasks/audit-2026-08-23-full-codebase.md, C2)
--
-- CRITICAL : "diagnostics_manage_staff" autorise FOR ALL sur l'ensemble des
-- colonnes pour tout compte de la clinique. Le seul garde-fou existant
-- (trg_enforce_diagnostic_validation_role, migration 006) ne protège que la
-- transition de validation_status — pas validated_by_user_id,
-- prescribed_by_user_id ni document_sealed_by_user_id. N'importe quel compte
-- authentifié de la clinique (réceptionniste compris) pouvait donc, via un
-- appel direct à l'API REST, attribuer une validation/prescription/scellement
-- à un autre praticien — un document médical faussement crédible.
--
-- lib/document-seal.ts passe en parallèle à un HMAC-SHA256 gardé par un secret
-- serveur (DOCUMENT_SEAL_SECRET) : quiconque ne détient pas ce secret ne peut
-- plus produire un sceau qui vérifie, quel que soit l'accès direct à la table.
-- Le sceau lui-même n'a donc plus besoin d'être verrouillé en écriture pour
-- rester fiable. Ce qui reste exploitable sans ce correctif, c'est
-- l'attribution : rien n'empêchait de désigner un *autre* compte que
-- l'appelant dans les colonnes d'imputabilité. On ajoute donc au trigger
-- existant une contrainte étroite — ces colonnes ne peuvent désigner que
-- auth.uid() lui-même — sans restreindre quels rôles peuvent appeler ces
-- actions (restriction qui relève d'une décision produit, hors du périmètre
-- de ce correctif de sécurité).
--
-- On verrouille aussi le sceau une fois posé : la Server Action
-- (actions/diagnostics.ts) refuse déjà de réenregistrer un document scellé,
-- mais un appel direct à l'API REST contournerait ce garde-fou applicatif.
--
-- Testé en direct sur une base locale (self-attribution acceptée,
-- attribution à un autre compte rejetée, réécriture d'un sceau déjà posé
-- rejetée) avant application.
-- ═══════════════════════════════════════════════════════════════════════════════

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

  -- Chaque colonne d'imputabilité est en écriture unique : une fois posée,
  -- elle ne peut plus être ni réattribuée à un autre compte, ni effacée
  -- (NEW ... IS NOT NULL gardait jusqu'ici la comparaison à auth.uid(), donc
  -- ne rejetait que la réattribution — la mise à NULL, elle, passait).
  IF OLD.validated_by_user_id IS NOT NULL
     AND NEW.validated_by_user_id IS DISTINCT FROM OLD.validated_by_user_id THEN
    RAISE EXCEPTION 'validated_by_user_id_is_immutable_once_set';
  END IF;
  IF NEW.validated_by_user_id IS NOT NULL
     AND NEW.validated_by_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'validated_by_user_id_must_be_self';
  END IF;

  IF OLD.prescribed_by_user_id IS NOT NULL
     AND NEW.prescribed_by_user_id IS DISTINCT FROM OLD.prescribed_by_user_id THEN
    RAISE EXCEPTION 'prescribed_by_user_id_is_immutable_once_set';
  END IF;
  IF NEW.prescribed_by_user_id IS NOT NULL
     AND NEW.prescribed_by_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'prescribed_by_user_id_must_be_self';
  END IF;

  IF OLD.document_sealed_by_user_id IS NOT NULL
     AND NEW.document_sealed_by_user_id IS DISTINCT FROM OLD.document_sealed_by_user_id THEN
    RAISE EXCEPTION 'document_sealed_by_user_id_is_immutable_once_set';
  END IF;
  IF NEW.document_sealed_by_user_id IS NOT NULL
     AND NEW.document_sealed_by_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'document_sealed_by_user_id_must_be_self';
  END IF;

  IF OLD.interaction_check_acknowledged_by_user_id IS NOT NULL
     AND NEW.interaction_check_acknowledged_by_user_id IS DISTINCT FROM OLD.interaction_check_acknowledged_by_user_id THEN
    RAISE EXCEPTION 'interaction_check_acknowledged_by_user_id_is_immutable_once_set';
  END IF;
  IF NEW.interaction_check_acknowledged_by_user_id IS NOT NULL
     AND NEW.interaction_check_acknowledged_by_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'interaction_check_acknowledged_by_user_id_must_be_self';
  END IF;

  IF OLD.document_seal IS NOT NULL AND NEW.document_seal IS DISTINCT FROM OLD.document_seal THEN
    RAISE EXCEPTION 'sealed_document_is_immutable';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
