import { PageShell } from "@/components/ui/page-shell";

export const metadata = { title: "Termini di servizio" };

export default function TermsPage() {
  return (
    <PageShell
      title="Termini di servizio"
      intro="Bozza tecnica. La versione finale richiederà revisione legale prima del lancio commerciale."
    >
      <div className="prose prose-neutral max-w-none space-y-6 text-foreground-muted">
        <section>
          <h2 className="text-lg font-semibold text-navy">Cosa è Lume</h2>
          <p>
            Lume è una batteria cognitiva orientativa basata sul modello CHC.
            Restituisce un profilo descrittivo dei processi cognitivi
            dell&apos;utente. È destinato a un uso di autoesplorazione e
            sviluppo personale.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy">Cosa Lume non è</h2>
          <ul className="list-disc pl-6">
            <li>Lume non è un test del QI.</li>
            <li>Lume non è uno strumento diagnostico.</li>
            <li>
              Lume non è un dispositivo medico né sostituisce strumenti clinici
              riservati.
            </li>
            <li>
              Lume non può essere usato per la selezione del personale. Questo
              uso è esplicitamente vietato dai presenti termini.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy">Età minima</h2>
          <p>
            L&apos;accesso è riservato a persone di età pari o superiore a 18
            anni.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy">
            Indice Cognitivo Composito Lume
          </h2>
          <p>
            L&apos;ICL è uno score interno al campione Lume, calcolato sulla
            distribuzione di chi ha completato lo strumento. Non è un QI
            normato sulla popolazione italiana. Viene sempre presentato con
            banda di confidenza e accompagnato dal profilo a cinque fattori.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
