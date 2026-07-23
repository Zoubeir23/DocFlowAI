-- ═══════════════════════════════════════════════════════════════════════════════
-- 016 — Suivi d'étape du wizard diagnostic + colonnes remplies progressivement
--        (audit fonctionnalité diagnostic 2026-07-23)
--
-- CRITICAL : actions/diagnostics.ts lit/écrit `current_step` sur chaque étape
-- du wizard (createDiagnosticDraft, updateDiagnosticSymptoms,
-- updateDiagnosticAnalysis, updateDiagnosticPrescription, edit/page.tsx pour
-- la reprise), mais cette colonne n'a jamais été ajoutée au schéma versionné.
-- Sans elle, toute création de diagnostic échoue en base ("column current_step
-- does not exist").
--
-- CRITICAL (lié) : chief_complaint, patient_age_years, patient_age_group et
-- patient_sex sont déclarés NOT NULL dans 001_schema.sql, mais le wizard les
-- remplit progressivement — patient_age_years/age_group/sex à l'étape 1
-- (optionnels côté formulaire, cf. patient-profile-step.tsx) et
-- chief_complaint seulement à l'étape 2. createDiagnosticDraft insère
-- explicitement chief_complaint: null à l'étape 1, ce qui viole la contrainte
-- NOT NULL sur toute création de diagnostic.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS current_step INTEGER NOT NULL DEFAULT 2
  CHECK (current_step BETWEEN 1 AND 6);

ALTER TABLE diagnostics ALTER COLUMN chief_complaint DROP NOT NULL;
ALTER TABLE diagnostics ALTER COLUMN patient_age_years DROP NOT NULL;
ALTER TABLE diagnostics ALTER COLUMN patient_age_group DROP NOT NULL;
ALTER TABLE diagnostics ALTER COLUMN patient_sex DROP NOT NULL;
