import { PageShell } from "@/components/ui/page-shell";

export const metadata = { title: "La tua sessione" };

export default function AssessmentHubPage() {
  return (
    <PageShell
      title="La tua sessione"
      intro="Undici attività, cinque dimensioni. Puoi sospendere e riprendere quando vuoi."
    >
      <div className="rounded-lg border border-border bg-surface-soft p-8 text-foreground-muted">
        Hub della sessione, in arrivo dalla sessione 3. Mostrerà progresso per
        task (completato, in corso, da iniziare) con stato persistente lato
        server.
      </div>
    </PageShell>
  );
}
