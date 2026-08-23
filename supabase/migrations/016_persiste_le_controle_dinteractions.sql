-- ═══════════════════════════════════════════════════════════════════════════════
-- 016 — Persistance du contrôle d'interactions médicamenteuses
--        (audit complet 2026-08-23 — tasks/audit-2026-08-23-full-codebase.md, H2)
--
-- L'API RxNav interrogée par lib/who-drug-interactions.ts a été retirée par le
-- NLM (404 constaté en direct le 2026-08-23) : le contrôle échoue
-- systématiquement. Rien n'empêchait jusqu'ici l'enregistrement de
-- l'ordonnance en cas d'échec ou d'interaction trouvée, et rien n'en gardait
-- trace. Le résultat effectivement obtenu au moment de la génération du
-- document est désormais persisté, avec l'acquittement explicite exigé par
-- actions/diagnostics.ts quand le contrôle échoue ou trouve une interaction.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS interaction_check_status TEXT
  CHECK (interaction_check_status IN ('not_applicable', 'checked_clear', 'checked_found', 'unavailable'));
ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS interaction_check_acknowledged_at TIMESTAMPTZ;
ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS interaction_check_acknowledged_by_user_id UUID
  REFERENCES users(id) ON DELETE SET NULL;

-- actions/diagnostics.ts ne renseigne les deux champs d'acquittement qu'ensemble,
-- et seulement quand le contrôle a échoué ou trouvé une interaction — cette
-- cohérence n'était garantie que côté application. NOT VALID + VALIDATE
-- CONSTRAINT évite de bloquer les écritures le temps de valider les lignes
-- existantes (ici vides, mais la table n'est pas toujours restée petite).
ALTER TABLE diagnostics ADD CONSTRAINT diagnostics_interaction_ack_coherent
  CHECK (
    (interaction_check_acknowledged_at IS NULL) = (interaction_check_acknowledged_by_user_id IS NULL)
    AND (
      interaction_check_acknowledged_at IS NULL
      OR interaction_check_status IN ('checked_found', 'unavailable')
    )
  ) NOT VALID;

ALTER TABLE diagnostics VALIDATE CONSTRAINT diagnostics_interaction_ack_coherent;
