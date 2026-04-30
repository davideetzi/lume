import { PageShell } from "@/components/ui/page-shell";

export const metadata = { title: "Consenso informato" };

export default function ConsentPage() {
  return (
    <PageShell
      title="Consenso informato"
      intro="Prima di iniziare ti chiediamo due cose distinte. Il consenso al trattamento dei dati per erogare il servizio è necessario. Il consenso alla cessione anonimizzata per fini di ricerca è opzionale e revocabile in qualsiasi momento."
    >
      <div className="space-y-6 rounded-lg border border-border bg-surface-soft p-8">
        <p className="text-foreground-muted">
          Pagina bloccante con doppia checkbox in arrivo nella sessione 2.
          Servizio (necessario) e ricerca (opzionale, revocabile). Versione
          consenso firmata viene tracciata in <code>ConsentRecord</code>.
        </p>
        <p className="text-sm text-foreground-muted">
          Lume non è un test del QI, non è uno strumento diagnostico, non
          sostituisce valutazioni cliniche professionali. Maggiori dettagli
          nella pagina dedicata al consenso.
        </p>
      </div>
    </PageShell>
  );
}
