-- ═══════════════════════════════════════════════════════════════════════════════
-- 019 — Expiration des clés API publiques (audit approfondi RBAC 2026-07-21)
--
-- MEDIUM : api_keys n'a pas de colonne expires_at ; une clé qui fuit (log,
-- repo, historique de commande) reste exploitable indéfiniment tant qu'elle
-- n'est pas révoquée manuellement. Les clés existantes reçoivent une
-- expiration à 1 an à partir de maintenant ; les nouvelles clés expirent 1 an
-- après leur création (valeur par défaut, applicative).
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
UPDATE api_keys SET expires_at = created_at + INTERVAL '1 year' WHERE expires_at IS NULL;
