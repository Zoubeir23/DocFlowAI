-- ═══════════════════════════════════════════════════════════════════════════════
-- 012 — Traçabilité non répudiable des validations/prescriptions médicales
--        + suivi d'étape du wizard diagnostic
--        (audit approfondi carnet médical 2026-07-21 / audit fonctionnalité
--        diagnostic 2026-07-23)
--
-- CRITICAL : validated_by, practitioner_name, practitioner_title et
-- practitioner_rpps sont des champs texte libre saisis côté client, sans
-- aucun lien avec auth.uid(). Un compte owner (pas nécessairement médecin)
-- peut donc valider un diagnostic ou une prescription en y inscrivant
-- l'identité de n'importe quel praticien, y compris un numéro RPPS qui
-- n'est pas le sien — fraude documentaire totalement déniable puisque rien
-- ne relie le document au compte réel qui l'a produit.
--
-- On ajoute une colonne de référence vers le compte authentifié qui a
-- effectué l'action, remplie côté serveur et jamais exposée en écriture au
-- client. Les champs texte restent modifiables (libellé affiché sur le
-- document), mais chaque validation/prescription est désormais imputable à
-- un compte précis et vérifiable — condition nécessaire pour toute
-- investigation en cas de litige.
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

ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS validated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS prescribed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS current_step INTEGER NOT NULL DEFAULT 2
  CHECK (current_step BETWEEN 1 AND 6);

ALTER TABLE diagnostics ALTER COLUMN chief_complaint DROP NOT NULL;
ALTER TABLE diagnostics ALTER COLUMN patient_age_years DROP NOT NULL;
ALTER TABLE diagnostics ALTER COLUMN patient_age_group DROP NOT NULL;
ALTER TABLE diagnostics ALTER COLUMN patient_sex DROP NOT NULL;
