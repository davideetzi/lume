import { PageShell } from "@/components/ui/page-shell";

export const metadata = { title: "Crea il tuo accesso" };

export default function SignupPage() {
  return (
    <PageShell
      title="Crea il tuo accesso"
      intro="L'accesso serve a salvare il tuo profilo e a permetterti di tornare in seguito. Puoi sospendere e riprendere la sessione in qualsiasi momento."
      maxWidth="sm"
    >
      <div className="rounded-lg border border-border bg-surface-soft p-8 text-foreground-muted">
        Form di registrazione, in arrivo nella sessione 2 (NextAuth + email
        magic link + credentials, validazione Zod, età minima 18, Demografia
        opzionale separata in onboarding).
      </div>
    </PageShell>
  );
}
