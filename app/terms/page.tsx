import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — DocFlow IA",
  description: "Conditions générales d'utilisation de DocFlow IA, logiciel de gestion médicale.",
};

const LAST_UPDATED = "1er juin 2026";
const CONTACT_EMAIL = "legal@docflow.ia";
const COMPANY = "DocFlow IA";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://docflow.ia";

export default function TermsPage() {
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
          <p className="font-mono text-xs uppercase tracking-widest text-foreground/40">Mentions légales</p>
          <h1 className="font-cormorant font-normal text-4xl text-foreground">Conditions Générales d&apos;Utilisation</h1>
          <p className="text-sm text-foreground/50">Dernière mise à jour : {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-sm max-w-none text-foreground/80 space-y-10">

          {/* 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Présentation du service</h2>
            <p>
              {COMPANY} est un logiciel de gestion de cabinet médical assisté par intelligence artificielle, accessible à l&apos;adresse <strong>{APP_URL}</strong>.
              Il permet aux professionnels de santé de gérer leurs rendez-vous, leur dossier patient, leurs diagnostics et leurs communications, via une interface web sécurisée.
            </p>
            <p>
              L&apos;utilisation de la plateforme implique l&apos;acceptation pleine et entière des présentes Conditions Générales d&apos;Utilisation (CGU).
            </p>
          </section>

          {/* 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Accès et création de compte</h2>
            <p>
              L&apos;accès au service est réservé aux professionnels de santé (médecins, praticiens, personnel administratif médical) et aux structures de soins (cabinets, cliniques, centres de santé).
            </p>
            <p>
              Lors de la création de votre compte, vous vous engagez à fournir des informations exactes, complètes et à jour. Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toute activité effectuée depuis votre compte.
            </p>
            <p>
              {COMPANY} se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGU, d&apos;utilisation abusive ou frauduleuse du service.
            </p>
          </section>

          {/* 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Données de santé et responsabilités médicales</h2>
            <p>
              {COMPANY} est un outil d&apos;aide à la gestion et non un dispositif médical au sens réglementaire. Les diagnostics, prescriptions et recommandations générés par l&apos;intelligence artificielle sont fournis à titre indicatif uniquement et ne se substituent en aucun cas au jugement clinique du professionnel de santé.
            </p>
            <p>
              <strong>Le praticien demeure seul responsable de ses actes médicaux.</strong> Il lui appartient de vérifier, valider ou rejeter toute suggestion de l&apos;IA avant tout acte médical.
            </p>
            <p>
              Les données de santé saisies dans la plateforme sont traitées conformément au Règlement Général sur la Protection des Données (RGPD) et aux législations locales applicables. Consultez notre{" "}
              <Link href="/privacy" className="text-[#14b8a6] hover:underline">Politique de Confidentialité</Link>{" "}
              pour plus de détails.
            </p>
          </section>

          {/* 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Utilisation acceptable</h2>
            <p>Vous vous engagez à ne pas :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Utiliser le service à des fins illicites ou contraires à la déontologie médicale</li>
              <li>Tenter d&apos;accéder aux données d&apos;autres utilisateurs ou cliniques</li>
              <li>Soumettre des données de patients sans leur consentement préalable</li>
              <li>Reproduire, copier ou revendre tout ou partie du service sans autorisation</li>
              <li>Introduire des virus, malwares ou tout code malveillant dans la plateforme</li>
              <li>Utiliser des moyens automatisés (bots, scrapers) pour accéder au service</li>
            </ul>
          </section>

          {/* 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Plans tarifaires et paiements</h2>
            <p>
              {COMPANY} propose différents plans tarifaires décrits sur la page <Link href="/pricing" className="text-[#14b8a6] hover:underline">Tarifs</Link>.
              Les paiements sont traités de manière sécurisée via Stripe (carte bancaire) ou en cryptomonnaie (USDC sur réseau Polygon).
            </p>
            <p>
              Les abonnements sont sans engagement et peuvent être résiliés à tout moment depuis votre espace. La résiliation prend effet à la fin de la période d&apos;abonnement en cours.
            </p>
            <p>
              En cas de litige relatif à un paiement, contactez-nous à <strong>{CONTACT_EMAIL}</strong> dans les 30 jours suivant la transaction.
            </p>
          </section>

          {/* 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Disponibilité et maintenance</h2>
            <p>
              {COMPANY} s&apos;engage à maintenir une disponibilité optimale du service, mais ne peut garantir une accessibilité ininterrompue. Des opérations de maintenance peuvent entraîner des interruptions temporaires, préalablement notifiées autant que possible.
            </p>
            <p>
              {COMPANY} ne pourra être tenu responsable des préjudices résultant d&apos;une indisponibilité temporaire du service.
            </p>
          </section>

          {/* 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble des éléments constituant la plateforme {COMPANY} (design, code, marque, contenus) est protégé par les droits de propriété intellectuelle. Toute reproduction, modification ou exploitation non autorisée est strictement interdite.
            </p>
            <p>
              Les données saisies par les utilisateurs (patients, diagnostics, rendez-vous) restent leur propriété exclusive. {COMPANY} n&apos;acquiert aucun droit de propriété sur ces données.
            </p>
          </section>

          {/* 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Limitation de responsabilité</h2>
            <p>
              Dans les limites permises par la loi applicable, {COMPANY} ne pourra être tenu responsable de dommages indirects, consécutifs, spéciaux ou punitifs résultant de l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser le service.
            </p>
            <p>
              La responsabilité totale de {COMPANY} ne saurait excéder les montants effectivement payés par l&apos;utilisateur au cours des 12 mois précédant le litige.
            </p>
          </section>

          {/* 9 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. Modification des CGU</h2>
            <p>
              {COMPANY} se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront notifiés par email des modifications substantielles. La poursuite de l&apos;utilisation du service après notification vaut acceptation des nouvelles CGU.
            </p>
          </section>

          {/* 10 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">10. Droit applicable et juridiction</h2>
            <p>
              Les présentes CGU sont régies par le droit français. En cas de litige, les parties s&apos;engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut d&apos;accord, les tribunaux compétents seront ceux du ressort du siège social de {COMPANY}.
            </p>
          </section>

          {/* 11 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">11. Contact</h2>
            <p>
              Pour toute question relative aux présentes CGU, contactez-nous à :{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#14b8a6] hover:underline">{CONTACT_EMAIL}</a>
            </p>
          </section>

        </div>

        {/* Footer nav */}
        <div className="pt-8 border-t border-foreground/10 flex flex-wrap gap-6 text-sm text-foreground/50">
          <Link href="/" className="hover:text-foreground transition-colors">Accueil</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Politique de Confidentialité</Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors">Tarifs</Link>
          <Link href="/login" className="hover:text-foreground transition-colors">Connexion</Link>
        </div>
      </main>
    </div>
  );
}
