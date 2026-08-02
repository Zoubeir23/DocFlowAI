# CLAUDE.md — DocFlow AI

## Project Overview

SaaS de gestion de cabinet médical : agent IA conversationnel de prise de rendez-vous, dossier patient avec codage WHO ICD-11, téléconsultation, site vitrine no-code et paiements hybrides (Stripe + USDC).

## Stack

- **Framework** : Next.js 15 (App Router) · React 19 · TypeScript 5
- **UI** : Tailwind 3 + Radix (shadcn) · `next-themes` (clair/sombre) · `next-intl` (fr / en)
- **Base de données** : Supabase (Postgres + Auth + RLS) — migrations SQL dans `supabase/migrations/`
- **IA** : multi-fournisseurs — Claude, Gemini, OpenAI, Ollama (`lib/ai/router.ts`)
- **Paiements** : Stripe (carte) + USDC sur Polygon via ethers (`REQUIRED_CHAIN_ID = 0x89`)
- **Intégrations** : Twilio (SMS), Resend/nodemailer (email), Upstash (rate limit), Sentry, serveur MCP
- **Tests** : Vitest (environnement `node`) · **CI** : `.github/workflows/ci.yml` (Node 24)

## Architecture

```
app/
  (app)/app/…        Espace praticien authentifié (dashboard, agenda, patients, diagnostics…)
  (admin)/admin/…    Super-admin multi-cliniques
  (auth)/…           login, signup
  api/v1/…           API REST publique (clés API + HMAC)
  api/mcp/…          Serveur MCP pour Claude Desktop
  widget/[slug]      Widget de réservation embarquable (iframe, hors middleware auth)
  clinique/[slug]    Site vitrine publié par le website builder
  portail/…          Portail patient
actions/             Server Actions — TOUTE mutation applicative passe par ici
components/          Par domaine (appointments, diagnostics, landing, widget…), pas par type
lib/                 Logique métier pure et clients externes (ai/, stripe/, sms/, who-*.ts, rbac.ts)
messages/            fr.json + en.json — les deux locales doivent rester à parité
supabase/migrations/ Migrations SQL numérotées, jamais modifiées après merge
```

**Règles structurantes :**
- Mutations = **Server Actions** dans `actions/`, pas de route API interne. `app/api/` est réservé aux webhooks, à l'API publique `v1`, au MCP et aux proxys externes (WHO, OpenFDA).
- Composants **Server par défaut** ; `"use client"` uniquement si état, effet ou événement navigateur.
- Isolation multi-tenant par **RLS Supabase** sur 100 % des tables, doublée par `lib/rbac.ts` (`super_admin` > `owner` > staff).
- `middleware.ts` rafraîchit la session Supabase et pose l'en-tête `x-user-authenticated`.

## Key Conventions

### Git Workflow
- Toujours `git checkout main && git pull origin main` **avant** de créer une branche
- Branches : `Feature/<code>-description` ou `Fix/<code>-description` (ex. `Feature/061-sections-landing`)
- Commits : `<code>-titre-court` (ex. `061-ajoute-la-section-tarifs`)
- Minimum 30 commits atomiques par tâche, jamais de commit vide ou artificiel
- Ne jamais publier de mention d'outil IA dans les commits, PR ou commentaires GitHub

### Code Style
- Fichiers en `kebab-case` (`pricing-preview-section.tsx`), composants en `PascalCase`
- **Jamais d'abréviation** : `previousTotal` pas `prevTot`, `AdminOrderUpdateView` pas `AdminOrdUpdView`
- Commentaires et messages utilisateur **en français**
- Immutabilité : créer un nouvel objet, ne jamais muter (`{ ...previous, field }`)
- Fichiers ≤ 800 lignes, fonctions ≤ 50 lignes — extraire plutôt que gonfler
- Validation aux frontières avec **Zod** (`lib/validations.ts`), jamais faire confiance à une entrée externe
- Pas de `any` (règle ESLint active), pas de `console.log` en production

### Design System
- Couleurs **uniquement** via les tokens de `app/globals.css` (`bg-card`, `text-muted-foreground`, `bg-primary/10`) — aucune couleur sombre ou hexadécimale codée en dur, sinon le thème clair casse
- Accent produit : teal (`--primary: 173 80% 30%`)
- Typographie : `font-cormorant` (titres), `font-sans` = DM Sans (corps), `font-mono` = IBM Plex Mono (micro-libellés)
- Tout texte visible passe par `next-intl` — ajouter la clé dans `fr.json` **et** `en.json`

### React / Next.js Conventions
- Un composant = une responsabilité ; découper dès qu'un fichier dépasse ~250 lignes
- `getTranslations` côté serveur, `useTranslations` côté client
- État partagé : Zustand (`lib/store/`) ou React Query — pas de prop drilling
- Pas de valeur en dur : constantes en tête de fichier ou config partagée (`lib/subscription/pricing-plans.ts`)

## Commands

```bash
npm run dev            # serveur de développement
npm run build          # build de production (à lancer avant toute PR)
npm run lint           # ESLint (dette préexistante : ne pas aggraver)
npm run test:run       # Vitest une passe
npm run test:coverage  # couverture (seuils : 80 lignes / 80 fonctions / 70 branches)
npm run db:migrate     # supabase db push
npm run db:generate    # régénère types/supabase.ts
npm run seed           # données de démonstration
```

## Testing

- Tests dans `__tests__/lib/`, environnement `node` — pas de DOM, donc **pas de rendu de composants**
- Tester en priorité : logique métier `lib/`, sécurité/isolation, parité i18n, configuration partagée
- Écrire le test **avant** le correctif sur un bug : reproduire (RED), corriger (GREEN), refactorer
- Avant toute PR : `npx tsc --noEmit`, `npm run test:run` et `npm run build` doivent passer

## Engineering Rules

### Avant de coder
- Lire le code existant et identifier le pattern en place — ne jamais supposer, inférer depuis la codebase
- Vérifier si une fonctionnalité existe déjà (`lib/`, `actions/`) avant d'en écrire une nouvelle

### Plan avant d'exécuter
- Toute tâche à 3+ étapes : planifier d'abord (fichiers affectés, risques, rollback)
- Si le plan dévie en cours de route : stop et re-planification

### Vérification avant de finir
- Le code tourne sans erreur, les logs sont propres, les edge cases sont gérés
- Les fonctionnalités existantes ne sont pas cassées
- Vérifier le rendu en thème **clair et sombre** pour tout changement d'interface

### Correction de bugs
1. Reproduire · 2. Lire les logs · 3. Localiser la cause racine · 4. Corriger à la source, pas le symptôme

## Anti-patterns

- Muter un objet ou un tableau existant
- Contourner la RLS avec la clé `service_role` sans contrôle d'autorisation explicite
- Écrire une route API interne pour une mutation qui devrait être une Server Action
- Coder une couleur en dur (`bg-[#14b8a6]`, `bg-white`, `text-white`) au lieu d'un token de thème
- Ajouter une chaîne visible sans sa traduction dans les deux locales
- Modifier une migration déjà mergée — en créer une nouvelle
- Dupliquer prix, quotas ou limites : source unique dans `lib/subscription/`
- Avaler une erreur silencieusement (`catch {}` sans retour utilisateur ni log)
- Ignorer un échec de test ou de build « parce que ça marche en local »
