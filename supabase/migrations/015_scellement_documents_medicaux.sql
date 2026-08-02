-- ═══════════════════════════════════════════════════════════════════════════════
-- 015 — Scellement des documents médicaux
--        (audit signature / carnet / ordonnance 2026-08-02)
--
-- La signature apposée sur une ordonnance est une image : elle n'est liée à
-- aucun contenu. Modifier une posologie après validation réaffichait la même
-- signature, sans que rien ne le signale — le document restait crédible alors
-- qu'il ne correspondait plus à ce que le médecin avait validé.
--
-- On conserve donc une empreinte SHA-256 du contenu au moment où le document est
-- produit. À l'affichage, l'empreinte est recalculée et comparée : toute
-- divergence prouve une modification postérieure.
--
-- PORTÉE : contrôle d'intégrité, pas signature électronique au sens eIDAS. Il
-- détecte une modification après coup ; il ne prouve pas l'identité du signataire
-- par un certificat, et l'horodatage est celui du serveur, non celui d'une
-- autorité de temps. Ces limites sont assumées et documentées dans
-- lib/document-seal.ts.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS document_seal        TEXT;
ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS document_sealed_at   TIMESTAMPTZ;
ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS document_sealed_by_user_id UUID
  REFERENCES users(id) ON DELETE SET NULL;

COMMENT ON COLUMN diagnostics.document_seal IS
  'Empreinte SHA-256 du contenu du document au moment de sa production. Calculée et écrite côté serveur uniquement (lib/document-seal.ts).';

-- Les documents produits avant cette migration restent sans sceau : ils ne sont
-- pas suspects, ils sont simplement non vérifiables. L'interface les affiche
-- comme « non scellé », distinct de « altéré ».
