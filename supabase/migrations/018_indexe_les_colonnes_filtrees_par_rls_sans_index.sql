-- ═══════════════════════════════════════════════════════════════════════════════
-- 018 — Indexe les colonnes filtrées par une politique RLS ou une clé étrangère
--        à fort volume, restées sans index depuis leur création
--        (audit complet 2026-08-23 — tasks/audit-2026-08-23-full-codebase.md, H8)
--
-- diagnostics.carnet_id, patients.carnet_id, les colonnes d'imputabilité
-- ajoutées par les migrations 010/015/016 et carnet_import_events.imported_by_user_id
-- n'ont jamais reçu d'index. Chaque lecture du carnet partagé
-- (diagnostics_select_shared_carnet, migration 004) ou chaque suppression en
-- cascade d'un compte force un balayage complet de la table concernée.
-- doctor_signatures.clinic_id, référencée par ON DELETE CASCADE depuis
-- 001_schema.sql, a la même lacune.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_diagnostics_carnet_id ON diagnostics (carnet_id) WHERE carnet_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_diagnostics_validated_by_user_id ON diagnostics (validated_by_user_id) WHERE validated_by_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_diagnostics_prescribed_by_user_id ON diagnostics (prescribed_by_user_id) WHERE prescribed_by_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_diagnostics_document_sealed_by_user_id ON diagnostics (document_sealed_by_user_id) WHERE document_sealed_by_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_patients_carnet_id ON patients (carnet_id) WHERE carnet_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_carnet_import_events_imported_by_user_id ON carnet_import_events (imported_by_user_id) WHERE imported_by_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_doctor_signatures_clinic_id ON doctor_signatures (clinic_id);
