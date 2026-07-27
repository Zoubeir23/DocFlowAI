
<div align="center">

<br/>

<img src="public/logo.png" alt="DocFlow AI" width="220" />

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-2.47-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Stripe](https://img.shields.io/badge/Stripe-22-6772E5?style=flat-square&logo=stripe&logoColor=white)](https://stripe.com)

<br/>

> **Agent IA conversationnel · Gestion médicale · Website Builder · Paiements hybrides**  
> *Une seule plateforme pour digitaliser entièrement un cabinet médical.*

<br/>

</div>

---

## Vue d'ensemble

**DocFlow AI** est un SaaS clé-en-main conçu pour les médecins et cliniques.  
Il combine un tableau de bord médical complet, un agent IA multi-fournisseurs capable de prendre des rendez-vous en autonomie, un constructeur de site vitrine sans code, et un système de paiement hybride (Stripe + crypto).

---

## Fonctionnalités

<table>
<tr>
<td width="50%">

**🤖 Agent IA Multi-Fournisseurs**
- Claude (Anthropic), Gemini (Google), OpenAI, Ollama (local)
- Prise de rendez-vous 100% autonome par chat
- Widget `<iframe>` intégrable sur n'importe quel site
- Prompts personnalisables par clinique

</td>
<td width="50%">

**📅 Tableau de Bord Médical**
- Calendrier interactif des rendez-vous
- Gestion complète des patients (CRUD + historique)
- Catalogue de services & durées configurables
- Statistiques et métriques temps réel

</td>
</tr>
<tr>
<td width="50%">

**🩺 Dossier Médical & Diagnostics**
- Wizard de diagnostic assisté par IA, étape par étape
- Codage international WHO ICD-11 / ICF / ICHI
- Vérification d'interactions médicamenteuses (OpenFDA)
- Prescriptions et carnet numérique partagé au patient

</td>
<td width="50%">

**🎥 Téléconsultation**
- Salle vidéo Jitsi Meet générée automatiquement par RDV
- Aucune installation ni compte tiers requis pour le patient
- Lien unique envoyé par email/SMS

</td>
</tr>
<tr>
<td width="50%">

**🌐 Website Builder**
- Éditeur visuel de site vitrine sans code
- 3 templates premium (Cabinet Éditorial, Lumière Privée, Structure Brut)
- Upload d'images, couleurs, typographie
- Publication en un clic sur URL personnalisée

</td>
<td width="50%">

**💳 Paiements Hybrides & Essai Gratuit**
- Stripe (cartes, abonnements récurrents, portail client self-service)
- Web3 — USDC sur Polygon via MetaMask / WalletConnect
- Essai gratuit 14 jours sur Starter/Professional, sans carte bancaire
- Quotas par plan (Free / Starter / Pro / Enterprise)

</td>
</tr>
<tr>
<td width="50%">

**🔌 Automatisation — API, MCP, Zapier/Make**
- API REST publique (`/api/v1/*`) authentifiée par clé API
- Serveur MCP natif — pilotage par Claude Desktop en langage naturel
- Webhooks sortants signés HMAC pour Zapier / Make
- Portail patient dédié (`/portail`) avec accès à son propre dossier

</td>
<td width="50%">

**📧 Emails & SMS Transactionnels**
- Confirmation patient automatique après réservation
- Rappels SMS via Twilio (optionnel)
- Google SMTP (500 emails/jour gratuit) ou Resend
- Templates HTML bilingues (FR / EN)

</td>
</tr>
<tr>
<td width="50%">

**🔐 Sécurité Production**
- Row Level Security (RLS) Supabase sur toutes les tables
- Guards d'ownership + rôles sur chaque action serveur
- Protection SSRF sur les webhooks sortants (anti DNS-rebinding)
- Headers CSP, HSTS, X-Frame-Options configurés

</td>
<td width="50%">

**⚡ Rate Limiting & Fiabilité**
- Upstash Redis en production (fallback mémoire en dev)
- Endpoints publics (widget, API, webhooks) tous limités par IP
- Rappels de RDV automatiques via Vercel Cron
- Panneau super-admin multi-cliniques (`/admin`)

</td>
</tr>
</table>

---

## Stack technique

<table>
<tr>
<th>Couche</th>
<th>Technologie</th>
<th>Rôle</th>
</tr>
<tr>
<td><b>Frontend</b></td>
<td>Next.js 15, React 19, Tailwind CSS 3</td>
<td>App Router, Server Components, SSR</td>
</tr>
<tr>
<td><b>Langage</b></td>
<td>TypeScript 5, Zod</td>
<td>Typage strict, validation des entrées</td>
</tr>
<tr>
<td><b>Base de données</b></td>
<td>Supabase (PostgreSQL)</td>
<td>Auth, BDD, Storage, RLS, RPC</td>
</tr>
<tr>
<td><b>IA</b></td>
<td>Claude, Gemini, OpenAI, Ollama</td>
<td>Agent conversationnel & prise de RDV</td>
</tr>
<tr>
<td><b>Paiements</b></td>
<td>Stripe 22, wagmi, viem, Reown AppKit</td>
<td>Cartes + crypto USDC Polygon</td>
</tr>
<tr>
<td><b>Email</b></td>
<td>Nodemailer (SMTP), Resend</td>
<td>Notifications transactionnelles</td>
</tr>
<tr>
<td><b>i18n</b></td>
<td>next-intl 4</td>
<td>FR / EN (interface + emails)</td>
</tr>
<tr>
<td><b>Déploiement</b></td>
<td>Vercel</td>
<td>Edge, CDN mondial, preview deployments</td>
</tr>
</table>

---

## Base de données : Supabase (production) vs Neon (dev/staging)

**Supabase est le seul provider supporté pour faire tourner l'application.** Ce n'est pas qu'une base Postgres : Supabase fournit aussi l'authentification (Auth, sessions, `auth.uid()`), le stockage de fichiers (Storage) et le moteur qui exécute les policies **Row Level Security** de `supabase/migrations/`. Ces policies reposent sur `auth.uid()` et le schéma `auth`, qui n'existent que sur la plateforme Supabase — retirer Supabase casserait l'authentification, l'upload de fichiers et l'isolation entre cliniques (RLS).

**Neon peut être utilisé en complément, uniquement pour le schéma SQL brut**, en dev/staging — par exemple pour explorer la structure des tables, tester des migrations avant de les pousser sur Supabase, ou faire tourner des requêtes d'analyse sur une copie du schéma sans toucher aux données de production. Neon ne remplace pas Supabase : login, upload de fichiers et RLS ne fonctionneront pas sur une base Neon nue, faute d'équivalent à Supabase Auth/Storage.

```bash
# 1. Créer un projet sur https://console.neon.tech/
# 2. Récupérer la chaîne de connexion (Dashboard → Connection string)
# 3. Dans .env.local :
DATABASE_PROVIDER="neon"
NEON_DATABASE_URL="postgres://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require"

# 4. Appliquer le schéma SQL sur Neon (garde-fou : refuse si DATABASE_PROVIDER != "neon")
npm run db:migrate:neon
```

Le script (`scripts/migrate-neon.ts`) applique chaque fichier de `supabase/migrations/` dans l'ordre, garde une table `_neon_migrations` pour ne jamais rejouer une migration déjà appliquée, et s'arrête proprement à la première erreur. Certaines migrations référencent `auth.users`/`auth.uid()` (fournis par Supabase Auth) : elles échoueront sur une base Neon qui n'a pas ce schéma — le script l'indique explicitement dans son message d'erreur plutôt que d'échouer silencieusement.

---

## Prérequis

| Outil | Version minimale | Lien |
|---|---|---|
| Node.js | **20+** | [nodejs.org](https://nodejs.org/fr) |
| npm | **10+** | inclus avec Node.js |
| Git | toute version | [git-scm.com](https://git-scm.com) |
| Compte Supabase | — | [supabase.com](https://supabase.com) |

```bash
# Vérifier les versions installées
node -v   # doit afficher v20.x.x ou supérieur
npm -v    # doit afficher 10.x.x ou supérieur
```

---

## Installation rapide

### 1. Cloner & installer

```bash
git clone <url-du-repo> docflow-ai
cd docflow-ai
npm install
```

### 2. Configurer Supabase

1. Créez un projet sur [supabase.com](https://supabase.com) → **New project**
2. Allez dans **SQL Editor** → **New query**
3. Exécutez **chaque fichier** du dossier `supabase/migrations/` **dans l'ordre numérique** (`001_...` jusqu'au dernier). Le nombre et le nom exact des fichiers évoluent avec le projet — fiez-vous au contenu réel du dossier plutôt qu'à une liste figée ici. À titre indicatif, la structure actuelle :

```
supabase/migrations/
├── 001_schema.sql                       ← tables principales
├── 002_functions_indexes_triggers.sql   ← fonctions PostgreSQL (booking, quota...)
├── 003_rls_policies.sql                 ← sécurité Row Level Security
├── 004_medical_carnets.sql              ← dossier médical / diagnostics
├── ...
└── 012_starter_professional_free_trial.sql
```

> Alternative en local/CI : `npm run db:migrate` (nécessite la Supabase CLI et `supabase link`).

4. Allez dans **Storage** → **New bucket**
   - Nom : `clinic-assets`
   - Type : **Public bucket** ✅

### 3. Créer le fichier `.env.local`

À la racine du projet (même niveau que `package.json`), créez un fichier nommé **exactement** `.env.local`.

> ⚠️ Ce fichier ne doit **jamais** être partagé ni poussé sur Git. Il est déjà dans le `.gitignore`.

---

<details>
<summary><b>📋 Bloc 1 — Supabase (obligatoire)</b></summary>

#### Ce que vous allez coller dans `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Comment obtenir ces 3 valeurs

1. Connectez-vous sur [supabase.com](https://supabase.com) et ouvrez votre projet.
2. Dans la barre latérale gauche, cliquez sur l'icône **engrenage ⚙️** tout en bas → **"Project Settings"**.
3. Dans le sous-menu qui s'ouvre, cliquez sur **"API"** (pas "Auth", pas "Database" — "API").
4. Vous voyez maintenant 3 blocs :

| Ce que vous voyez sur la page | Variable `.env.local` |
|---|---|
| **Project URL** (ex: `https://abcdefgh.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` |
| **Project API keys → anon public** (commence par `eyJ...`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Project API keys → service_role** (commence par `eyJ...`) | `SUPABASE_SERVICE_ROLE_KEY` |

5. Cliquez sur le bouton **"Copy"** à droite de chaque valeur et collez-la dans `.env.local`.

> ⚠️ La clé `service_role` a des droits d'administrateur complets sur votre base de données. Ne l'utilisez jamais dans du code côté client (navigateur). Dans ce projet, elle est uniquement utilisée dans les Server Actions et les routes API serveur.

</details>

---

<details>
<summary><b>🤖 Bloc 2 — Intelligence Artificielle (obligatoire)</b></summary>

Vous devez choisir **un seul fournisseur IA** pour commencer. Mettez sa valeur dans `ACTIVE_AI_PROVIDER` et ajoutez uniquement la clé correspondante.

```env
# Choisir : claude | gemini | openai | ollama
ACTIVE_AI_PROVIDER="claude"
```

---

### Option A — Claude d'Anthropic (recommandé)

1. Allez sur [console.anthropic.com](https://console.anthropic.com) et créez un compte (ou connectez-vous).
2. Dans le menu de gauche, cliquez sur **"API Keys"**.
3. Cliquez sur **"Create Key"**, donnez-lui un nom (ex: `docflow-local`), puis cliquez sur **"Create Key"**.
4. **Copiez immédiatement** la clé affichée — elle ne sera plus jamais visible après fermeture de cette fenêtre.
5. Collez-la dans `.env.local` :

```env
ANTHROPIC_API_KEY="sk-ant-api03-..."
```

> La clé ressemble à : `sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

---

### Option B — Gemini de Google (gratuit avec quota)

1. Allez sur [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
2. Connectez-vous avec votre compte Google.
3. Cliquez sur **"Create API key"**.
4. Sélectionnez un projet Google Cloud existant ou laissez-en créer un automatiquement.
5. La clé s'affiche sous la forme `AIzaSy...` — copiez-la.

```env
GEMINI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

> La clé ressemble à : `AIzaSy` suivi de 33 caractères alphanumériques.

---

### Option C — OpenAI (ChatGPT)

1. Allez sur [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. Connectez-vous (ou créez un compte sur [platform.openai.com](https://platform.openai.com)).
3. Cliquez sur **"+ Create new secret key"**, donnez-lui un nom, puis cliquez sur **"Create secret key"**.
4. **Copiez immédiatement** la clé — elle ne sera plus jamais affichée.

```env
OPENAI_API_KEY="sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

> ⚠️ OpenAI requiert un solde de crédit > 0 pour que l'API fonctionne. Allez dans **Billing** et ajoutez au moins 5 $ de crédit.

---

### Option D — Ollama (local, 100% gratuit, aucune clé nécessaire)

Ollama exécute un modèle IA directement sur votre ordinateur, sans envoi de données à l'extérieur.

1. Téléchargez et installez Ollama depuis [ollama.com](https://ollama.com) (Mac, Linux ou Windows).
2. Lancez l'application Ollama (une icône apparaît dans la barre des tâches).
3. Ouvrez un terminal et téléchargez un modèle :

```bash
ollama pull llama3        # modèle généraliste (4.7 Go)
# ou, si vous avez peu de RAM :
ollama pull llama3:8b     # version plus légère
```

4. Vérifiez qu'Ollama est bien lancé :

```bash
curl http://localhost:11434/api/tags
# Doit répondre avec la liste des modèles installés
```

```env
OLLAMA_BASE_URL="http://localhost:11434"
```

> Ollama doit rester **démarré** pendant toute l'utilisation de DocFlow AI.

</details>

---

<details>
<summary><b>📧 Bloc 3 — Email (obligatoire pour les notifications)</b></summary>

Deux variables communes quel que soit le fournisseur choisi :

```env
ACTIVE_EMAIL_PROVIDER="smtp"       # smtp | resend
ADMIN_EMAIL="vous@votre-domaine.com"  # adresse qui reçoit les alertes admin
```

> `ADMIN_EMAIL` est l'adresse qui reçoit les demandes Enterprise et les alertes système. Elle est différente de l'adresse d'envoi.

---

### Option A — Google SMTP via Gmail (recommandé, gratuit jusqu'à 500 emails/jour)

> Vous utilisez votre propre adresse Gmail comme expéditeur. Google exige un **mot de passe d'application** distinct de votre mot de passe Gmail habituel.

**Étape 1 — Activer la validation en deux étapes** *(obligatoire pour créer un mot de passe d'application)*

1. Allez sur [myaccount.google.com](https://myaccount.google.com).
2. Dans le menu gauche, cliquez sur **"Sécurité"**.
3. Dans la section *"Comment vous connecter à Google"*, cliquez sur **"Validation en deux étapes"**.
4. Suivez les instructions pour l'activer si ce n'est pas déjà fait.

**Étape 2 — Créer un mot de passe d'application**

1. Toujours sur [myaccount.google.com](https://myaccount.google.com) → **"Sécurité"**.
2. Dans la barre de recherche en haut de la page des paramètres Google, tapez : `mots de passe des applications`
3. Cliquez sur le résultat **"Mots de passe des applications"** (ou allez directement sur [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
4. Dans le champ **"Nom de l'application"**, tapez `DocFlow` puis cliquez sur **"Créer"**.
5. Google affiche un mot de passe de **16 caractères** en 4 groupes de 4 lettres (ex: `abcd efgh ijkl mnop`).
6. **Copiez ce mot de passe en supprimant les espaces** → vous obtenez 16 caractères collés (ex: `abcdefghijklmnop`).

```env
SMTP_GOOGLE_EMAIL="votre.adresse@gmail.com"
GOOGLE_APP_PASSWORD="abcdefghijklmnop"
```

> ⚠️ Le mot de passe d'application doit être collé **sans espaces**. Les 4 groupes affichés par Google sont uniquement pour la lisibilité.

---

### Option B — Resend (alternatif, domaine personnalisé)

1. Créez un compte sur [resend.com](https://resend.com).
2. Dans le tableau de bord, allez dans **"API Keys"** → **"Create API Key"**.
3. Donnez-lui un nom (ex: `docflow`), choisissez les permissions **"Full access"**, puis cliquez **"Add"**.
4. Copiez la clé affichée (commence par `re_`).

```env
ACTIVE_EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

</details>

---

<details>
<summary><b>💳 Bloc 4 — Stripe (paiements par carte)</b></summary>

> Utilisez le mode **Test** pendant le développement. Aucune vraie transaction n'aura lieu.

#### Clés API Stripe

1. Créez un compte sur [dashboard.stripe.com/register](https://dashboard.stripe.com/register).
2. Une fois connecté, vérifiez que le bouton en haut à droite indique **"Mode test"** (fond orange). Si vous voyez "Mode production", cliquez dessus pour basculer en test.
3. Dans le menu gauche, cliquez sur **"Développeurs"** → **"Clés API"**.
4. Vous voyez deux clés :

| Clé visible sur Stripe | Variable `.env.local` |
|---|---|
| **Clé publiable** (commence par `pk_test_`) | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| **Clé secrète** (commence par `sk_test_`, cliquez "Afficher") | `STRIPE_SECRET_KEY` |

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
STRIPE_SECRET_KEY="sk_test_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

#### Clé de signature Webhook (pour les paiements en local)

Le webhook permet à Stripe de notifier votre application quand un paiement réussit. En local, vous avez besoin de la Stripe CLI.

**Installer la Stripe CLI :**

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (avec Scoop)
scoop install stripe

# Linux
# Télécharger depuis https://stripe.com/docs/stripe-cli
```

**Démarrer l'écoute des webhooks :**

```bash
# Se connecter à votre compte Stripe
stripe login

# Démarrer le tunnel (laissez cette commande tourner en arrière-plan)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

La console affiche une ligne comme :
```
> Ready! Your webhook signing secret is whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Copiez cette valeur :

```env
STRIPE_WEBHOOK_SECRET="whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

> ⚠️ Cette commande `stripe listen` doit rester active dans un terminal pendant tout votre développement. Elle crée un tunnel entre les serveurs Stripe et votre machine locale.

</details>

---

<details>
<summary><b>🔗 Bloc 5 — Web3 / Paiements crypto (optionnel)</b></summary>

Ce bloc est nécessaire uniquement si vous souhaitez activer les paiements en USDC (stablecoin) sur la blockchain Polygon. Vous pouvez ignorer ce bloc si vous n'utilisez que Stripe.

#### WalletConnect Project ID

WalletConnect permet aux utilisateurs de connecter leur portefeuille (MetaMask, Coinbase Wallet, etc.) à DocFlow AI.

1. Allez sur [cloud.walletconnect.com](https://cloud.walletconnect.com) et créez un compte.
2. Cliquez sur **"Create project"**.
3. Donnez un nom au projet (ex: `DocFlow AI`) et sélectionnez le type **"App"**.
4. Cliquez sur **"Create"**.
5. Votre **Project ID** s'affiche sur la page du projet (une chaîne de 32 caractères hexadécimaux).

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
```

#### Adresse du portefeuille administrateur

C'est l'adresse Ethereum/Polygon sur laquelle vous recevrez les paiements USDC.

1. Ouvrez MetaMask (extension Chrome ou application mobile).
2. Cliquez sur votre nom de compte en haut (ex: "Account 1").
3. Copiez l'adresse affichée (commence par `0x`, fait 42 caractères).

```env
NEXT_PUBLIC_CRYPTO_WALLET_ADDRESS="0xAbCdEf1234567890AbCdEf1234567890AbCdEf12"
```

#### Prix des plans en USDC

Définissez les tarifs de vos abonnements (en dollars, 1 USDC = 1 USD) :

```env
NEXT_PUBLIC_PLAN_STARTER_PRICE="49"
NEXT_PUBLIC_PLAN_PROFESSIONAL_PRICE="99"
NEXT_PUBLIC_PLAN_ENTERPRISE_PRICE="299"
```

</details>

---

#### Exemple de fichier `.env.local` complet

Voici un modèle prêt à copier-coller. Remplacez chaque `...` par vos vraies valeurs :

```env
# ─── Supabase ────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJI..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJI..."

# ─── Intelligence Artificielle ───────────────────────────
ACTIVE_AI_PROVIDER="claude"
ANTHROPIC_API_KEY="sk-ant-api03-..."
# GEMINI_API_KEY="AIzaSy..."
# OPENAI_API_KEY="sk-proj-..."
# OLLAMA_BASE_URL="http://localhost:11434"

# ─── Email ───────────────────────────────────────────────
ACTIVE_EMAIL_PROVIDER="smtp"
ADMIN_EMAIL="admin@votre-domaine.com"
SMTP_GOOGLE_EMAIL="votre.clinique@gmail.com"
GOOGLE_APP_PASSWORD="motdepasseapplication"
# RESEND_API_KEY="re_..."

# ─── Stripe ──────────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ─── Web3 (optionnel) ────────────────────────────────────
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="..."
NEXT_PUBLIC_CRYPTO_WALLET_ADDRESS="0x..."
NEXT_PUBLIC_PLAN_STARTER_PRICE="49"
NEXT_PUBLIC_PLAN_PROFESSIONAL_PRICE="99"
NEXT_PUBLIC_PLAN_ENTERPRISE_PRICE="299"
```

### 4. Lancer l'application

```bash
# Développement (hot reload)
npm run dev

# Production
npm run build && npm start
```

Ouvrir **[http://localhost:3000](http://localhost:3000)**

---

## Parcours de test

```
1. /signup          → Créer un compte médecin
2. /onboarding      → Nommer la clinique, configurer le fuseau horaire
3. /app/dashboard   → Tableau de bord principal
4. /app/settings    → Configurer les disponibilités & services
5. /app/ai-settings → Personnaliser l'agent IA, copier l'iframe widget
6. /app/website-builder → Créer la page vitrine, publier
7. /clinique/[slug] → Voir la page publique de la clinique
8. /widget/[slug]   → Tester le widget IA en autonomie
```

---

## Déploiement Vercel

```bash
# Installer la CLI Vercel
npm i -g vercel

# Déployer
vercel

# Configurer les variables d'environnement
vercel env add NEXT_PUBLIC_SUPABASE_URL
# ... répéter pour chaque variable
```

Ou via l'interface Vercel : **Settings → Environment Variables** — importer toutes les variables du fichier `.env.local`.

> **Important** : En production, configurez le webhook Stripe avec votre vraie URL Vercel (`https://votreapp.vercel.app/api/webhooks/stripe`) et remplacez les clés `pk_test` / `sk_test` par les clés live.

---

## Structure du projet

```
docflow-ai/
├── app/
│   ├── (app)/app/          # Pages authentifiées (dashboard, patients, etc.)
│   ├── api/                # Routes API (widget, webhooks, upload)
│   ├── clinique/[slug]/    # Page publique de la clinique
│   ├── widget/[slug]/      # Widget IA intégrable
│   └── page.tsx            # Landing page
├── actions/                # Server Actions Next.js
├── components/
│   ├── layout/             # Sidebar, Topbar, Header
│   ├── widget/             # Composant chatbot widget
│   └── website-builder/    # Éditeur de site vitrine
├── lib/
│   ├── ai/                 # Router multi-fournisseurs IA
│   ├── email/              # Templates et envoi d'emails
│   ├── slots.ts            # Génération des créneaux disponibles
│   └── subscription/       # Gestion des quotas par plan
├── supabase/migrations/    # Scripts SQL (à exécuter dans l'ordre)
└── messages/               # Traductions FR / EN (next-intl)
```

---

## Sécurité

- **`.env.local`** : ne jamais committer — déjà dans `.gitignore`
- **`SUPABASE_SERVICE_ROLE_KEY`** : serveur uniquement, jamais côté client
- **Clés Stripe** : utiliser `pk_test` / `sk_test` en développement uniquement
- **RLS Supabase** : activé sur toutes les tables — chaque clinique ne voit que ses données
- Les endpoints widget (`/api/widget/*`) ont un rate limiter dédié (10 req/min en booking, 30 req/min en chat)

---

## Aide & dépannage

<details>
<summary><b>L'application ne démarre pas</b></summary>

- Vérifier que `.env.local` existe à la racine et contient au minimum les clés Supabase
- Vérifier `node -v` ≥ 20
- Supprimer `.next/` et relancer : `rm -rf .next && npm run dev`

</details>

<details>
<summary><b>Erreur Supabase "relation does not exist"</b></summary>

Les migrations SQL n'ont pas toutes été exécutées. Reprendre depuis l'étape **3.3** en exécutant chaque fichier `supabase/migrations/*.sql` dans l'ordre numérique.

</details>

<details>
<summary><b>Le widget IA ne répond pas</b></summary>

- Vérifier que `ACTIVE_AI_PROVIDER` est défini et que la clé API correspondante est présente
- Tester la clé API directement sur la console du fournisseur
- Vérifier les logs dans la console Next.js

</details>

<details>
<summary><b>Les emails ne partent pas</b></summary>

- Vérifier que `ADMIN_EMAIL` est défini
- Pour Gmail : le mot de passe d'application doit être sans espaces (16 caractères collés)
- Vérifier que la validation en deux étapes est activée sur le compte Google

</details>

<details>
<summary><b>Upload d'images bloqué</b></summary>

- Vérifier que le bucket `clinic-assets` existe dans Supabase Storage et est en mode **Public**
- Vérifier les politiques RLS Storage dans Supabase : l'utilisateur authentifié doit avoir les droits `INSERT` et `SELECT`

</details>

---

<div align="center">

<br/>

Construit avec Next.js · Supabase · Claude · Stripe

<br/>

</div>
