import { ShieldOff, Mail } from "lucide-react";
import Link from "next/link";

export default function BlockedPage() {
  const supportEmail = process.env.NEXT_PUBLIC_EMAIL_FROM ?? "support@docflow.ai";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldOff className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compte désactivé</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Votre compte a été temporairement désactivé. Contactez notre support
            pour obtenir de l&apos;aide.
          </p>
        </div>
        <a
          href={`mailto:${supportEmail}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Mail className="w-4 h-4" />
          Contacter le support
        </a>
        <p className="text-xs text-muted-foreground">
          <Link href="/login" className="underline hover:text-foreground transition-colors">
            Se connecter avec un autre compte
          </Link>
        </p>
      </div>
    </div>
  );
}
