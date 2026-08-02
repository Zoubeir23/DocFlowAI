import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

interface FooterLink {
  href: string;
  label: string;
}

/**
 * Pied de page de la landing : quatre colonnes (produit, développeurs, portail
 * patient, mentions) sur les surfaces du thème actif.
 */
export async function LandingFooter() {
  const t = await getTranslations("landing.footer");

  const productLinks: FooterLink[] = [
    { href: "/#features", label: t("aiAgent") },
    { href: "/#medical-record", label: t("medicalRecord") },
    { href: "/#widget", label: t("widget") },
    { href: "/pricing", label: t("pricing") },
  ];

  // Les outils développeurs vivent dans l'espace authentifié : un visiteur non
  // connecté est redirigé vers la connexion par le middleware.
  const developerLinks: FooterLink[] = [
    { href: "/app/integrations", label: t("apiDocs") },
    { href: "/app/integrations", label: t("mcp") },
    { href: "/app/integrations", label: t("webhooks") },
    { href: "/#security", label: t("security") },
  ];

  return (
    <footer className="bg-card border-t border-border text-muted-foreground">
      <div className="max-w-7xl mx-auto px-6 py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-5">
          <Image
            src="/logo.png"
            alt="DocFlow IA"
            width={130}
            height={34}
            className="object-contain dark:brightness-0 dark:invert"
          />
          <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">{t("tagline")}</p>
        </div>

        <nav aria-label={t("productTitle")}>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground mb-5">
            {t("productTitle")}
          </h2>
          <ul className="space-y-3">
            {productLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("developersTitle")}>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground mb-5">
            {t("developersTitle")}
          </h2>
          <ul className="space-y-3">
            {developerLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground mb-5">
            {t("portalTitle")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">{t("portalDesc")}</p>
          <Link
            href="/portail"
            className="group inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40 transition-colors"
          >
            {t("portalCta")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 DocFlow IA. {t("rights")}</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/login" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {t("login")}
            </Link>
            <Link href="/signup" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {t("signup")}
            </Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {t("terms")}
            </Link>
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {t("privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
