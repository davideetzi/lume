import { PageShell } from "@/components/ui/page-shell";

export const metadata = { title: "Accedi" };

export default function SigninPage() {
  return (
    <PageShell
      title="Accedi"
      intro="Bentornato. Il tuo profilo Lume ti aspetta dove l'hai lasciato."
      maxWidth="sm"
    >
      <div className="rounded-lg border border-border bg-surface-soft p-8 text-foreground-muted">
        Form di accesso, in arrivo nella sessione 2.
      </div>
    </PageShell>
  );
}
