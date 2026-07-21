-- ═══════════════════════════════════════════════════════════════════════════════
-- 014 — Traçabilité non répudiable des validations/prescriptions médicales
--        (audit approfondi carnet médical 2026-07-21)
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
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS validated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS prescribed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
