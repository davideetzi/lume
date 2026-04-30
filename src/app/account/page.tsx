import { PageShell } from "@/components/ui/page-shell";

export const metadata = { title: "Il tuo account" };

export default function AccountPage() {
  return (
    <PageShell
      title="Il tuo account"
      intro="Qui puoi modificare le tue informazioni, esportare i tuoi dati o cancellare il tuo account. Il consenso alla ricerca è revocabile in ogni momento."
    >
      <div className="rounded-lg border border-border bg-surface-soft p-8 text-foreground-muted">
        Pannello account in arrivo nelle sessioni successive. Includerà: modifica
        demografia, revoca consenso ricerca, export dati personali (JSON),
        cancellazione account con purge differito.
      </div>
    </PageShell>
  );
}
