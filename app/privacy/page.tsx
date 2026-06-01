import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de Confidentialité — DocFlow IA",
  description: "Politique de confidentialité et traitement des données personnelles de santé par DocFlow IA.",
};

const LAST_UPDATED = "1er juin 2026";
const CONTACT_EMAIL = "privacy@docflow.ia";
const COMPANY = "DocFlow IA";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://docflow.ia";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="border-b border-foreground/10 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/">
          <Image src="/logo.png" alt="DocFlow IA" width={120} height={32} className="object-contain dark:brightness-0 dark:invert" />
        </Link>
        <Link href="/login" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
          Se connecter
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        {/* Title */}
        <div className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-foreground/40">Données personnelles</p>
          <h1 className="font-cormorant font-normal text-4xl text-foreground">Politique de Confidentialité</h1>
          <p className="text-sm text-foreground/50">Dernière mise à jour : {LAST_UPDATED}</p>
        </div>

        <div className="p-4 bg-[#14b8a6]/5 border border-[#14b8a6]/20 rounded-lg">
          <p className="text-sm text-foreground/70 leading-relaxed">
            <strong className="text-foreground">Données de santé :</strong> {COMPANY} traite des données médicales à caractère personnel et des données de santé. Ces données bénéficient d&apos;une protection renforcée conformément au RGPD (articles 9 et 35) et aux législations nationales applicables. Nous ne vendons jamais vos données à des tiers.
          </p>
        </div>

        <div className="prose prose-sm max-w-none text-foreground/80 space-y-10">

          {/* 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement des données personnelles collectées via la plateforme {COMPANY} ({APP_URL}) est la société {COMPANY}.
            </p>
            <p>
              Pour toute question relative à la protection de vos données, contactez notre Délégué à la Protection des Données (DPD) à :{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#14b8a6] hover:underline">{CONTACT_EMAIL}</a>
            </p>
          </section>

          {/* 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Données collectées</h2>
            <p>Nous collectons les catégories de données suivantes :</p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Données des professionnels de santé (utilisateurs)</h3>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Nom, prénom, adresse email</li>
                  <li>Informations sur la structure médicale (nom, adresse)</li>
                  <li>Données de facturation (traitées par Stripe, non stockées par nos soins)</li>
                  <li>Logs de connexion et d&apos;activité</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground text-sm">Données des patients (données de santé — catégorie spéciale)</h3>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Identité : nom, prénom, date de naissance, sexe</li>
                  <li>Coordonnées : téléphone, email</li>
                  <li>Données médicales : antécédents, allergies, constantes vitales, diagnostics, prescriptions, notes médicales</li>
                  <li>Historique des rendez-vous</li>
                  <li>Données de pré-consultation (formulaires)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground text-sm">Données techniques</h3>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Adresse IP, type de navigateur, système d&apos;exploitation</li>
                  <li>Cookies de session (authentification uniquement)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Finalités et bases légales du traitement</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-foreground/10">
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Finalité</th>
                    <th className="text-left py-2 font-semibold text-foreground">Base légale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/5">
                  {[
                    ["Fourniture du service (gestion des RDV, patients, diagnostics)", "Exécution du contrat"],
                    ["Authentification et sécurité des comptes", "Intérêt légitime"],
                    ["Génération de synthèses IA médicales", "Consentement explicite"],
                    ["Facturation et paiements", "Obligation légale"],
                    ["Envoi de notifications (rappels, confirmations)", "Exécution du contrat"],
                    ["Amélioration du service et statistiques anonymisées", "Intérêt légitime"],
                    ["Respect des obligations légales (archivage médical)", "Obligation légale"],
                  ].map(([finalite, base]) => (
                    <tr key={finalite}>
                      <td className="py-2 pr-4 text-foreground/70">{finalite}</td>
                      <td className="py-2 text-foreground/70">{base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Sous-traitants et transferts de données</h2>
            <p>Nous faisons appel aux sous-traitants suivants, tous soumis à des garanties contractuelles conformes au RGPD :</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-foreground/10">
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Prestataire</th>
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Rôle</th>
                    <th className="text-left py-2 font-semibold text-foreground">Localisation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/5">
                  {[
                    ["Supabase", "Hébergement base de données, authentification", "UE (AWS eu-west-1)"],
                    ["Vercel", "Hébergement de l'application web", "UE / USA"],
                    ["Stripe", "Traitement des paiements", "USA (Privacy Shield)"],
                    ["Anthropic / Google / OpenAI", "Traitement IA des textes médicaux", "USA"],
                    ["Upstash", "Rate limiting Redis", "UE"],
                    ["Twilio", "Envoi de SMS", "USA"],
                  ].map(([name, role, location]) => (
                    <tr key={name}>
                      <td className="py-2 pr-4 font-medium text-foreground">{name}</td>
                      <td className="py-2 pr-4 text-foreground/70">{role}</td>
                      <td className="py-2 text-foreground/70">{location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-foreground/60">
              Les données transmises aux API d&apos;IA (Anthropic, Google, OpenAI) pour la génération de synthèses médicales sont pseudonymisées avant envoi. Aucune donnée identifiante directe n&apos;est transmise.
            </p>
          </section>

          {/* 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Durée de conservation</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Données de compte utilisateur :</strong> durée de l&apos;abonnement + 3 ans après résiliation</li>
              <li><strong>Dossiers patients et données médicales :</strong> 20 ans à compter de la dernière consultation (conformément à la réglementation sur l&apos;archivage médical)</li>
              <li><strong>Données de facturation :</strong> 10 ans (obligation comptable légale)</li>
              <li><strong>Logs de connexion :</strong> 12 mois</li>
              <li><strong>Cookies de session :</strong> durée de la session + 7 jours (remember me)</li>
            </ul>
          </section>

          {/* 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Droit d&apos;accès :</strong> obtenir une copie de vos données</li>
              <li><strong>Droit de rectification :</strong> corriger des données inexactes</li>
              <li><strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données (sauf obligations légales)</li>
              <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
              <li><strong>Droit d&apos;opposition :</strong> vous opposer à certains traitements</li>
              <li><strong>Droit à la limitation :</strong> suspendre temporairement un traitement</li>
              <li><strong>Droit de retrait du consentement :</strong> à tout moment pour les traitements basés sur le consentement</li>
            </ul>
            <p>
              Pour exercer vos droits, envoyez une demande à{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#14b8a6] hover:underline">{CONTACT_EMAIL}</a>.
              Nous nous engageons à répondre dans un délai de 30 jours.
            </p>
            <p>
              Vous avez également le droit d&apos;introduire une réclamation auprès de l&apos;autorité de contrôle compétente (CNIL en France : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#14b8a6] hover:underline">cnil.fr</a>).
            </p>
          </section>

          {/* 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Sécurité des données</h2>
            <p>Nous mettons en œuvre les mesures de sécurité suivantes :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Chiffrement des données en transit (HTTPS/TLS 1.3)</li>
              <li>Chiffrement des données au repos (AES-256)</li>
              <li>Isolation des données par clinique via Row Level Security (RLS) Supabase</li>
              <li>Authentification sécurisée (bcrypt, OAuth2)</li>
              <li>Journalisation des accès et détection d&apos;anomalies</li>
              <li>Sauvegardes automatiques quotidiennes</li>
              <li>Contrôle d&apos;accès basé sur les rôles (RBAC)</li>
            </ul>
          </section>

          {/* 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Cookies</h2>
            <p>
              {COMPANY} utilise uniquement des cookies strictement nécessaires au fonctionnement du service (cookies de session d&apos;authentification Supabase). Nous n&apos;utilisons pas de cookies publicitaires ou de tracking tiers.
            </p>
          </section>

          {/* 9 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. Mineurs</h2>
            <p>
              Le service est destiné aux professionnels de santé majeurs. Les données de santé de patients mineurs sont traitées sous la responsabilité du praticien, conformément aux règles de consentement parental applicables.
            </p>
          </section>

          {/* 10 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">10. Modifications</h2>
            <p>
              Cette politique peut être mise à jour pour refléter des changements légaux ou dans nos pratiques. La date de dernière mise à jour est indiquée en haut de page. Les modifications substantielles vous seront notifiées par email.
            </p>
          </section>

          {/* 11 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">11. Contact</h2>
            <p>
              Pour toute question relative à cette politique ou pour exercer vos droits :{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#14b8a6] hover:underline">{CONTACT_EMAIL}</a>
            </p>
          </section>

        </div>

        {/* Footer nav */}
        <div className="pt-8 border-t border-foreground/10 flex flex-wrap gap-6 text-sm text-foreground/50">
          <Link href="/" className="hover:text-foreground transition-colors">Accueil</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">CGU</Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors">Tarifs</Link>
          <Link href="/login" className="hover:text-foreground transition-colors">Connexion</Link>
        </div>
      </main>
    </div>
  );
}
