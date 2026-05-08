# 🏥 DocFlow IA - SaaS Médical & Agent IA de Réservation

Bienvenue dans le code source de **DocFlow IA**, une plateforme SaaS complète pour les médecins et les cliniques.  
Elle permet de gérer les rendez-vous, les patients et intègre un Agent IA conversationnel (chatbot) installable sur n’importe quel site web, ainsi qu’un constructeur de site vitrine sans code.

Ce document vous explique **pas à pas** comment installer, configurer et lancer le projet sur votre propre machine.

---

## 📌 Fonctionnalités principales
- **Agent IA multi-fournisseurs** : Claude, Gemini, OpenAI, Ollama (local).
- **Tableau de bord médical** : calendrier, gestion des patients et des services.
- **Créateur de site vitrine** (Website Builder) pour les cliniques.
- **Paiements hybrides** : Stripe + crypto Web3.
- **Emails dynamiques** : Google SMTP (gratuit jusqu'à 500 emails/jour) ou Resend.

---

## 🧰 1. Prérequis logiciels
Avant de commencer, installez sur votre poste :

| Outil              | Version minimale | Lien de téléchargement                        |
|--------------------|------------------|-----------------------------------------------|
| Node.js            | 20 ou +          | https://nodejs.org/fr                         |
| Git                | n’importe laquelle | https://git-scm.com                         |
| Un éditeur de code | VS Code conseillé| https://code.visualstudio.com                |

**Vérifiez que Node.js est bien installé :**
```bash
node -v
npm -v
```

---

## 📦 2. Installation des dépendances
1. Ouvrez un terminal dans le dossier racine du projet.
2. Lancez :
   ```bash
   npm install
   ```
   Ceci installe toutes les bibliothèques nécessaires au fonctionnement du projet.

---

## 🗄️ 3. Configuration de la base de données (Supabase)
Supabase est une alternative open-source à Firebase. Elle fournit une base de données PostgreSQL, de l'authentification, du stockage de fichiers et des API en temps réel.

### 3.1 Créer un compte Supabase
- Rendez-vous sur [supabase.com](https://supabase.com)
- Cliquez sur **"Start your project"**.
- Connectez-vous avec GitHub, GitLab, Bitbucket ou email.

### 3.2 Créer un nouveau projet
- Cliquez sur **"New project"**.
- Donnez-lui un nom, par exemple `docflow`.
- Choisissez une région proche de vous.
- Choisissez un mot de passe de base de données **fort** (notez-le, vous en aurez besoin plus tard).
- Cliquez sur **"Create new project"** (l'initialisation prend environ 2 minutes).

### 3.3 Exécuter les migrations SQL
Les migrations sont des scripts qui créent les tables, les règles de sécurité et les fonctions nécessaires. Elles se trouvent dans le dossier `/supabase/migrations/` de ce projet.

1. Dans le tableau de bord Supabase, allez dans le menu **SQL Editor** (éditeur SQL).
2. Cliquez sur **"New query"**.
3. **Copiez le contenu** du premier fichier de migration présent dans `/supabase/migrations/`.
4. Collez-le dans l'éditeur.
5. Cliquez sur le bouton **"Run"** (ou Ctrl + Entrée).
6. Répétez l'opération pour chacun des fichiers du dossier, **dans l'ordre** (les noms commencent souvent par un horodatage, exécutez-les du plus ancien au plus récent).

### 3.4 Créer un bucket de stockage public
Le projet a besoin d'un espace pour stocker des fichiers (logos, photos, etc.).
1. Dans le menu de gauche, cliquez sur **Storage**.
2. Cliquez sur **"New bucket"**.
3. Nommez-le (par exemple `public-assets`).
4. Cochez **"Public bucket"** (les fichiers seront accessibles publiquement via une URL).
5. Cliquez sur **"Create bucket"**.

---

## ⚙️ 4. Variables d’environnement (fichier `.env.local`)
Le fichier `.env.local` contient toutes les clés secrètes et identifiants de connexion. **Il ne doit jamais être partagé ni versionné sur Git.** Il est déjà dans le `.gitignore` du projet.

### 4.1 Où créer ce fichier ?
À la racine du projet, créez un nouveau fichier nommé exactement `.env.local`.

### 4.2 Contenu et explications détaillées

#### A. Clés Supabase
```
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJI..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJI..."
```
**Comment les obtenir ?**
1. Dans votre projet Supabase, cliquez sur l’icône d’engrenage **"Settings"** (paramètres) en bas à gauche.
2. Sélectionnez **"API"**.
3. Copiez :
   - **Project URL** → à coller dans `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → à coller dans `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret key** (à utiliser avec précaution, elle a tous les droits) → à coller dans `SUPABASE_SERVICE_ROLE_KEY`

#### B. Fournisseur d’Intelligence Artificielle
```
ACTIVE_AI_PROVIDER="claude"      # ou "gemini", "openai", "ollama"
```
Vous devez choisir le fournisseur que vous voulez utiliser. Vous n’avez pas besoin de toutes les clés ci-dessous, seulement celle correspondant au fournisseur activé, mais c’est plus simple de toutes les mettre.

**Claude (Anthropic) :**
```
ANTHROPIC_API_KEY="sk-ant-api..."
```
- Allez sur [console.anthropic.com](https://console.anthropic.com)
- Créez un compte ou connectez-vous.
- Allez dans "API Keys" et générez une clé.

**Google Gemini :**
```
GEMINI_API_KEY="AIzaSy..."
```
- Allez sur [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) (Google AI Studio).
- Cliquez sur **"Create API Key"**.
- Sélectionnez un projet Google Cloud existant ou créez-en un nouveau.

**OpenAI (ChatGPT) :**
```
OPENAI_API_KEY="sk-..."
```
- Allez sur [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Connectez-vous (ou inscrivez-vous).
- Cliquez sur **"Create new secret key"**.

**Ollama (IA locale, gratuite) :**
```
OLLAMA_BASE_URL="http://localhost:11434"
```
- Installez Ollama depuis [ollama.com](https://ollama.com)
- Lancez l’application, puis dans un terminal : `ollama pull llama3` (ou autre modèle).
- L’URL par défaut est bien `http://localhost:11434`.

#### C. Clés Email (Google SMTP recommandé)
```
ACTIVE_EMAIL_PROVIDER="smtp"
GOOGLE_EMAIL="ma.clinique@gmail.com"
GOOGLE_APP_PASSWORD="xxxxxxxxxxxxxxx"
```
Pour utiliser votre adresse Gmail afin d’envoyer des emails (jusqu’à 500 par jour gratuitement) :

1. Connectez-vous à votre compte Google.
2. Allez dans **"Gérer votre compte Google" > "Sécurité"**.
3. Activez la **validation en deux étapes** si ce n’est pas déjà fait.
4. Dans la barre de recherche des paramètres, tapez "mots de passe des applications".
5. Cliquez sur **"Mots de passe des applications"**.
6. Sélectionnez "Autre (nom personnalisé)", donnez un nom par exemple `DocFlow` et cliquez sur **Générer**.
7. Copiez le mot de passe de 16 caractères (espaces exclus) et collez-le dans `GOOGLE_APP_PASSWORD`.
8. `GOOGLE_EMAIL` est simplement l’adresse Gmail utilisée.

#### D. Paiements Stripe
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```
**Obtenir les clés Stripe (mode test) :**
1. Allez sur [dashboard.stripe.com/register](https://dashboard.stripe.com/register) et créez un compte (gratuit).
2. Passez en mode **"Test"** (bascule en haut à droite).
3. Dans le menu gauche, allez dans **"Développeurs" > "Clés API"**.
4. Copiez la **clé publique** (pk_test_...) dans `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
5. Copiez la **clé secrète** (sk_test_...) dans `STRIPE_SECRET_KEY`.
6. Pour le webhook, rendez-vous dans **"Développeurs" > "Webhooks"**, créez un endpoint pointant vers `http://votredomaine/api/webhooks/stripe` (en local, utilisez l’extension Stripe CLI).
   - Installez [Stripe CLI](https://stripe.com/docs/stripe-cli)
   - Lancez `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - La console affichera un secret `whsec_...`, copiez-le dans `STRIPE_WEBHOOK_SECRET`.

#### E. Paiements Web3 (WalletConnect / MetaMask)
```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="votre_wallet_connect_id"
NEXT_PUBLIC_ADMIN_WALLET_ADDRESS="0xVotreAdresseMetamaskIci"
```
1. Allez sur [cloud.walletconnect.com](https://cloud.walletconnect.com/).
2. Connectez-vous et créez un projet.
3. Récupérez le **Project ID** et collez-le dans `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`.
4. Utilisez votre adresse Ethereum (MetaMask) dans `NEXT_PUBLIC_ADMIN_WALLET_ADDRESS` (pour recevoir les paiements en crypto).

---

## 💻 5. Lancement de l’application
Assurez-vous d'avoir correctement rempli votre fichier `.env.local`.  
Dans le terminal, à la racine du projet, exécutez :
```bash
npm run dev
```
Ouvrez votre navigateur sur [http://localhost:3000](http://localhost:3000).  
La première compilation peut prendre une à deux minutes.

---

## 🩺 6. Tester le logiciel pas à pas
Voici comment vérifier que tout fonctionne :

1. **Créer un compte clinique**  
   - Sur la page d'accueil, cliquez sur "Créer un compte".  
   - Utilisez une adresse email de test (ex: `test@docflow.com`) et un mot de passe.

2. **Onboarding**  
   - Après connexion, vous arrivez sur un formulaire où vous entrez le nom de votre clinique fictive, par exemple `"Cabinet Dentaire Paris"`.

3. **Tableau de bord médecin**  
   - Vous accédez à l’espace de gestion complet : agenda, patients, services.

4. **Test de l’Agent IA**  
   - Allez dans les paramètres IA ("AI Settings").  
   - Copiez le code `iframe` fourni.  
   - Collez ce code dans un fichier HTML local ou sur un site test : un widget chatbot apparaît, relié à votre clinique, capable de prendre des rendez-vous.

5. **Website Builder**  
   - Dans le menu, ouvrez l’onglet "Site Web".  
   - Construisez une page vitrine à l’aide de l’éditeur intégré.

---

## 🔐 Rappels de sécurité
- Ne commitez jamais le fichier `.env.local` (il est déjà dans `.gitignore`).
- La clé `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais être exposée côté client. Elle est utilisée uniquement dans les routes API ou les fonctions serveur.
- Utilisez toujours des clés de test (`pk_test`, `sk_test`) en développement.

---

## 🆘 Besoin d’aide ?
Si vous rencontrez un problème, vérifiez :
- Que votre fichier `.env.local` existe bien et est correctement rempli.
- Que Node.js a bien la version 20 ou supérieure.
- Que vous avez exécuté toutes les migrations SQL dans Supabase.
- Que vous avez créé le bucket de stockage en mode public.

Bonne découverte de DocFlow IA !