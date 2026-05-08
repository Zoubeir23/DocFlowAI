# DocFlow IA — Design Brief : Void Refined

## Objectif

Refonte complète du design de la landing page et de l'app (sidebar + dashboard) dans la direction **Void Refined** : noir pur, typographie Cormorant Garamond ultra-fine, bordures 1px, aucun remplissage coloré. Aesthetic montre de luxe suisse / haute couture médicale.

La charte couleur teal (#0d9488, #14b8a6) est **conservée** comme seul accent. Le fond passe de blanc à noir pur.

---

## Stack technique du projet

- **Framework** : Next.js 14+ (App Router)
- **Styling** : Tailwind CSS + `tailwind.config.ts`
- **Composants** : shadcn/ui (`components/ui/`)
- **i18n** : next-intl v4 (FR + EN — les textes sont dans `messages/fr.json` et `messages/en.json`)
- **Auth / Data** : Supabase
- **Fonts actuels** : système Tailwind par défaut

---

## Fichiers à modifier

| Fichier | Rôle |
|---|---|
| `app/globals.css` | Tokens CSS, utilitaires, keyframes |
| `tailwind.config.ts` | Palette, fonts, animations |
| `app/layout.tsx` | Import Google Fonts Cormorant Garamond |
| `app/page.tsx` | Landing page complète |
| `components/layout/sidebar.tsx` | Sidebar app (collapsible) |
| `app/(app)/app/dashboard/page.tsx` | Dashboard principal |
| `components/dashboard/stat-card.tsx` | Stat cards du dashboard |

---

## Design System — Void Refined

### Palette

```css
/* Fond */
--void-base: #000000;
--void-surface: rgba(255, 255, 255, 0.02);
--void-surface-hover: rgba(13, 148, 136, 0.03);

/* Texte */
--void-text-primary: #ffffff;
--void-text-secondary: rgba(255, 255, 255, 0.35);
--void-text-muted: rgba(255, 255, 255, 0.2);
--void-text-accent: #14b8a6;        /* teal — seul accent */

/* Bordures */
--void-border: rgba(255, 255, 255, 0.07);
--void-border-subtle: rgba(255, 255, 255, 0.04);
--void-border-accent: rgba(20, 184, 166, 0.25);

/* Teal brand */
--teal-glow: rgba(20, 184, 166, 0.15);
--teal-line: #14b8a6;
--teal-dim: rgba(20, 184, 166, 0.4);
```

### Typographie

Ajouter dans `app/layout.tsx` :

```tsx
import { Cormorant_Garamond, DM_Sans, IBM_Plex_Mono } from 'next/font/google'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

const ibmMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-ibm-mono',
})
```

Appliquer sur `<html>` :
```tsx
<html className={`${cormorant.variable} ${dmSans.variable} ${ibmMono.variable}`}>
```

### Règles typographiques

| Usage | Font | Weight | Taille | Style |
|---|---|---|---|---|
| Titres H1/H2 | Cormorant Garamond | 300 | 64–80px | normal ou italic pour les em |
| Sous-titres | Cormorant Garamond | 300 | 28–36px | normal, opacity 0.25 |
| Labels / eyebrows | DM Sans | 500 | 11–12px | UPPERCASE, letter-spacing .1em |
| Body | DM Sans | 300–400 | 14–16px | opacity 0.35 |
| Monospace / stats | IBM Plex Mono | 400–600 | variable | chiffres, URLs, codes |
| Stat numbers | Cormorant Garamond | 300 | 48–60px | line-height 1 |

### Règles de design

1. **Fond** : `#000000` partout. Pas de gris foncé.
2. **Cartes** : `background: rgba(255,255,255,0.02)` + `border: 1px solid rgba(255,255,255,0.07)`. **Aucun background coloré sur les cartes**.
3. **Hover** : fond passe à `rgba(13,148,136,0.03)`, bordure passe à `rgba(20,184,166,0.2)`.
4. **Bordures accent** : seule la ligne décorative horizontale (top de la carte) peut être un gradient teal → transparent.
5. **Boutons** :
   - Primaire : `border: 1px solid #14b8a6; background: none; color: #14b8a6; padding: 14px 28px; letter-spacing: .1em; text-transform: uppercase;`
   - Hover primaire : `background: rgba(20,184,166,0.06);`
   - Ghost : `border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.5);`
6. **Lignes décoratives** : `width: 40px; height: 1px; background: linear-gradient(90deg, #0d9488, transparent);`
7. **Séparateurs verticaux** : `border-left: 1px solid rgba(255,255,255,0.06);`
8. **Grilles features** : `gap: 1px; background: rgba(255,255,255,0.04)` → chaque cellule a `background: #000;`
9. **Aucun border-radius** sur les boutons et les grilles features. `border-radius: 0px;`
10. **border-radius modéré** sur les cartes : `border-radius: 2px` max, ou 0.

---

## Landing Page — Sections complètes

### Structure (dans l'ordre)

```
1. NAV
2. HERO (texte gauche + stats colonne droite)
3. MOCKUP DASHBOARD
4. PROOF STRIP (4 badges)
5. FEATURES (grille 3×2 avec bordures 1px)
6. HOW IT WORKS (3 étapes)
7. TESTIMONIALS (3 cartes)
8. CTA SECTION
9. FOOTER
```

### 1. NAV

```
Layout  : sticky, background #000, border-bottom 1px solid rgba(255,255,255,.05)
Height  : 64px, padding 0 48px
Logo    : ligne teal 40px + "DocFlow IA" en Cormorant 300, letter-spacing .15em, UPPERCASE
Links   : DM Sans 12px, UPPERCASE, letter-spacing .12em, color rgba(255,255,255,.3)
Boutons : ghost (border blanc .12) + primary (border teal)
```

### 2. HERO

```
Layout  : 2 colonnes — flex space-between
          Gauche : texte (flex:1)
          Droite : colonne stats (border-left 1px rgba(255,255,255,.06), padding-left 48px)

Gauche :
  - Eyebrow  : ligne teal 40px + texte Cormorant italic 14px, color rgba(255,255,255,.35)
  - H1       : Cormorant 300 76px, line-height 1, "La gestion / médicale / [em]redéfinie.[/em]"
               em = italic, color #14b8a6
  - H1-sub   : Cormorant 300 28px, color rgba(255,255,255,.25), "par l'intelligence artificielle"
  - Desc     : DM Sans 300 15px, color rgba(255,255,255,.35), max-width 420px
  - Boutons  : primary teal + ghost

Droite (stats verticales) :
  - 4 stats empilées, séparées par border-bottom 1px rgba(255,255,255,.04)
  - Valeur : Cormorant 300 52px, blanc
  - Unité  : 20px, color #14b8a6
  - Label  : IBM Plex Mono 11px, UPPERCASE, letter-spacing .1em, opacity .25
  Stats    : 12 RDV / 847 patients / 94% / 156 réserv. IA
```

### 3. MOCKUP DASHBOARD

```
Container  : border 1px solid rgba(255,255,255,.06)
             background rgba(255,255,255,.02)
             backdrop-filter blur(40px)
             NO border-radius

Top bar    : background rgba(0,0,0,.6), border-bottom 1px rgba(255,255,255,.04)
             dots (8px, opacity .4) + URL en Cormorant italic 12px

Intérieur  :
  Header   : "Tableau de bord" (IBM Plex Mono 9px, UPPERCASE) + greeting Cormorant 22px
             Bouton "VOIR LES RDV →" : border 1px rgba(20,184,166,.2), IBM Plex Mono 10px, color #14b8a6

  Stats    : grille 4 colonnes, gap 1px, background rgba(255,255,255,.04)
             Chaque cellule : background #000, padding 20px
             - Label : IBM Plex Mono 9px, color #14b8a6, UPPERCASE (AGENDA / PATIENTS / COMPLÉTION / IA)
             - Valeur : Cormorant 300 36px, blanc
             - Sous-label : 10px, rgba(255,255,255,.2), UPPERCASE

Ligne lumineuse : ::before position absolute top 0, height 1px
                  background linear-gradient(90deg, transparent, rgba(20,184,166,.3), transparent)
```

### 4. PROOF STRIP

```
border-top + border-bottom 1px solid rgba(255,255,255,.04)
padding 20px 48px, flex, gap 40px, justify-content center

Chaque item : dot 4px #0d9488 + DM Sans 12px UPPERCASE letter-spacing .08em opacity .25
Items : "500+ cliniques" / "10k+ réservations/mois" / "99.9% uptime" / "RGPD conforme"
```

### 5. FEATURES (grille)

```
Layout : grid 3 colonnes, gap 1px, background rgba(255,255,255,.04) → 6 cellules
         Chaque cellule : background #000, padding 40px 32px
         Hover : background rgba(13,148,136,.03)

Contenu de chaque cellule :
  - Numéro  : Cormorant italic 13px, color rgba(20,184,166,.5), "i." "ii." "iii." etc.
  - Titre   : Cormorant 400 24px, blanc
  - Desc    : DM Sans 300 13px, rgba(255,255,255,.3), line-height 1.8

6 features :
  i.   Assistant IA conversationnel
  ii.  Agenda synchronisé temps réel
  iii. CRM patients avancé
  iv.  Sécurité & conformité RGPD
  v.   Analytics & rapports
  vi.  Intégrations (Google, WhatsApp, site web)
```

### 6. HOW IT WORKS

```
Layout : 2 colonnes (titre gauche / timeline droite)
         padding 80px 48px, max-width 1200px

Gauche : label + H2 Cormorant 300 38px

Timeline (droite) :
  border-left 1px solid rgba(255,255,255,.06), padding-left 28px
  3 items empilés, padding-bottom 30px
  ::before = numéro (1 / 2 / 3) dans cercle 24px background #0d9488

  Chaque item :
    - Titre : Cormorant 400 18px, blanc
    - Desc  : DM Sans 300 13px, rgba(255,255,255,.3)

Étapes :
  1. "Connectez votre clinique" — profil + services en < 1h, sans code
  2. "Activez l'IA" — widget sur site, Google, WhatsApp
  3. "Gérez sans effort" — DocFlow gère RDV, rappels, suivis
```

### 7. TESTIMONIALS

```
Layout : grille 3 colonnes, gap 1px, background rgba(255,255,255,.04)
         (même pattern que features)
         padding 80px 48px

Chaque carte : background #000, padding 32px
  Ligne lumineuse top (::before gradient teal)
  - Étoiles : "★★★★★" DM Sans 12px, color rgba(255,183,0,.6)
  - Texte   : Cormorant italic 18px, color rgba(255,255,255,.5), line-height 1.7
              "«…»"
  - Séparateur : border-top 1px rgba(255,255,255,.04), margin-top 20px
  - Avatar  : 32px, border 1px solid rgba(20,184,166,.2), DM Sans 11px blanc, background transparent
  - Nom     : DM Sans 600 12px, blanc
  - Rôle    : DM Sans 300 11px, rgba(255,255,255,.25)

3 témoignages :
  Dr. Sarah Mitchell — Family Practice Physician
  "DocFlow IA a réduit nos appels de 70%. Les patients adorent réserver à toute heure."

  Dr. James Park — Pédiatre
  "L'assistant IA est remarquablement naturel. Les parents réservent de façon conversationnelle."

  Dr. Maria Santos — Dermatologue
  "Configuration en une heure, patients réservant via IA le jour même. ROI incroyable."
```

### 8. CTA SECTION

```
padding 100px 48px, text-align center, background #000

Ornement vertical : width 1px, height 60px
  background linear-gradient(180deg, transparent, rgba(20,184,166,.4), transparent)
  margin 0 auto 32px

H2  : Cormorant 300 60px, "La médecine digitale / [em]commence ici.[/em]"
Sub : DM Sans 300 14px, UPPERCASE, letter-spacing .08em, rgba(255,255,255,.25)
      "14 jours gratuits · Sans carte de crédit · Sans engagement"
Btn : même style primary teal, padding 16px 36px
```

### 9. FOOTER

```
padding 28px 48px, border-top 1px rgba(255,255,255,.04)
display flex, align-items center, justify-content space-between

Logo  : Cormorant 300 16px, UPPERCASE, letter-spacing .15em, rgba(255,255,255,.25)
Links : DM Sans 12px, rgba(255,255,255,.2), gap 20px (Tarifs / Connexion / Inscription)
Copy  : IBM Plex Mono 10px, rgba(255,255,255,.15), "© 2026 DocFlow IA"
```

---

## App (Sidebar + Dashboard) — Void Refined

### Sidebar (`components/layout/sidebar.tsx`)

```
Background : background #000, border-right 1px solid rgba(255,255,255,.05)
             Pas de glassmorphism, pas de gradient

Logo zone  : border-bottom 1px solid rgba(255,255,255,.04)
             "DocFlow IA" en Cormorant 300 italic, ligne teal à gauche

Labels nav : IBM Plex Mono 9px, UPPERCASE, letter-spacing .12em, rgba(255,255,255,.2)

Links nav  : DM Sans 13px, rgba(255,255,255,.3)
             Hover : rgba(255,255,255,.65), border-left 2px solid #14b8a6
             Active : color #14b8a6, border-left 2px solid #14b8a6
                      background rgba(13,148,136,.04)

Supprimer  : le badge IA (fond teal) dans la sidebar — remplacer par simple texte monospace

Sign out   : DM Sans 13px, rgba(255,255,255,.2)
             Hover : rgba(239,68,68,.6)

Toggle btn : border 1px solid rgba(255,255,255,.08), background #000, color rgba(20,184,166,.5)
```

### Stat Cards (`components/dashboard/stat-card.tsx`)

```
Background : background rgba(255,255,255,.02)
Border     : 1px solid rgba(255,255,255,.07)
Border-radius : 0 ou 2px max
Ligne top  : ::before gradient teal → transparent

Icône      : background transparent, border 1px solid rgba(20,184,166,.15)
             icône stroke #5eead4

Valeur     : Cormorant 300 42px, blanc
Label      : IBM Plex Mono 10px, UPPERCASE, rgba(255,255,255,.25)
Trend      : IBM Plex Mono 10px, color #14b8a6

Hover      : border-color rgba(20,184,166,.2), background rgba(13,148,136,.03)
```

---

## globals.css — Ce qu'il faut remplacer

### Tokens CSS à écraser

```css
:root {
  --background: 0 0% 0%;                    /* noir pur */
  --foreground: 0 0% 100%;
  --card: 0 0% 1%;
  --card-foreground: 0 0% 100%;
  --primary: 180 84% 38%;                   /* teal inchangé */
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 3%;
  --secondary-foreground: 0 0% 100%;
  --muted: 0 0% 5%;
  --muted-foreground: 0 0% 35%;
  --border: 0 0% 7%;
  --input: 0 0% 7%;
  --ring: 180 84% 38%;
  --radius: 0rem;                            /* zero radius — style suisse */
}
```

### Utilitaires à ajouter

```css
/* Void design utilities */
.void-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.07);
  position: relative;
  overflow: hidden;
  transition: background 0.3s, border-color 0.3s;
}
.void-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(20, 184, 166, 0.3), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}
.void-card:hover {
  background: rgba(13, 148, 136, 0.03);
  border-color: rgba(20, 184, 166, 0.2);
}
.void-card:hover::before {
  opacity: 1;
}

/* Teal decorative line */
.teal-line {
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, #0d9488, transparent);
}

/* Vertical teal flourish */
.teal-flourish {
  width: 1px;
  height: 60px;
  background: linear-gradient(180deg, transparent, rgba(20, 184, 166, 0.4), transparent);
  margin: 0 auto;
}

/* Grid cells pattern */
.void-grid {
  display: grid;
  gap: 1px;
  background: rgba(255, 255, 255, 0.04);
}
.void-grid > * {
  background: #000;
  transition: background 0.3s;
}
.void-grid > *:hover {
  background: rgba(13, 148, 136, 0.03);
}

/* Button variants */
.btn-void-primary {
  background: none;
  border: 1px solid #14b8a6;
  color: #14b8a6;
  padding: 14px 28px;
  font-size: 13px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: background 0.3s;
  cursor: pointer;
}
.btn-void-primary:hover {
  background: rgba(20, 184, 166, 0.06);
}
.btn-void-ghost {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.5);
  padding: 14px 28px;
  font-size: 13px;
  letter-spacing: 0.08em;
  transition: border-color 0.3s, color 0.3s;
  cursor: pointer;
}
.btn-void-ghost:hover {
  border-color: rgba(20, 184, 166, 0.4);
  color: rgba(255, 255, 255, 0.85);
}

/* Stat number */
.void-stat-number {
  font-family: var(--font-cormorant);
  font-weight: 300;
  font-size: 52px;
  color: #fff;
  line-height: 1;
  letter-spacing: -0.03em;
}

/* Supprime les anciens utilitaires glass/teal qui ne s'appliquent plus */
/* Remplacer : .glass, .glass-card, .glass-sidebar, .gradient-brand, etc. */
```

---

## Animations à conserver / modifier

### Conserver
- `fade-in-up` — utile pour le hero
- `pulse-ring` — remplacer la couleur : `rgba(20,184,166,0.25)` au lieu de `.4`

### Supprimer
- `gradient-mesh` (remplacer par `background: #000`)
- `gradient-hero` (CTA = fond noir + ornement teal)
- `hover-lift` (remplacer par hover void-card)

---

## Notes importantes pour l'implémentation

1. **i18n** : tous les textes sont dans `messages/fr.json` et `messages/en.json`. Ne pas hardcoder les strings — utiliser `t("landing.hero.titlePart1")` etc. comme dans le code actuel.

2. **Images** : le logo `/logo.png` existant — en version dark, appliquer `filter: brightness(0) invert(1)` pour le rendre blanc. En version sidebar, même filtre.

3. **Composants shadcn** : les `Button`, `Card` etc. héritent des CSS vars. En écrasant `--background`, `--border`, `--radius` dans `:root`, ils adapteront automatiquement leur look. Vérifier que les variantes `ghost` et `outline` des Button matchent bien le style void.

4. **Border-radius** : passer `--radius` à `0rem` dans globals.css écrasera tous les `rounded-lg`, `rounded-xl`, etc. dans shadcn. Préférable de cibler explicitement si certains composants doivent conserver un radius (ex: toasts).

5. **Suppression du gradient-mesh** : partout où `className="gradient-mesh"` est utilisé, remplacer par `bg-black`.

6. **Sidebar collapsible** : conserver la logique toggle (`useState collapsed`). Adapter uniquement le CSS.

7. **FullCalendar** : les overrides en bas de `globals.css` — adapter `.fc-button` pour le style void (border teal, background none).

---

## Référence visuelle

L'aesthetic de référence est **Void Refined** :
- Maison Margiela website
- IWC Schaffhausen digital
- Aesop skincare (structure)
- Linear.app (rigueur des grilles)

**Ce qui doit frapper l'œil** : le contraste saisissant entre le noir absolu et les seuls points de couleur teal — la ligne 40px, les bordures au hover, les numéros de stat. Aucune distraction. Chaque élément justifie sa présence.
