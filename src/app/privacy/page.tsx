import { PageShell } from "@/components/ui/page-shell";

export const metadata = { title: "Informativa privacy" };

export default function PrivacyPage() {
  return (
    <PageShell
      title="Informativa privacy"
      intro="Bozza tecnica. La versione finale richiederà revisione legale, in particolare sui flussi di anonimizzazione per fini di ricerca."
    >
      <div className="space-y-6 text-foreground-muted">
        <section>
          <h2 className="text-lg font-semibold text-navy">Titolare</h2>
          <p>Humanev. Il titolare del trattamento è Davide Etzi.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy">
            Dati trattati e finalità
          </h2>
          <ul className="list-disc pl-6">
            <li>
              Dati di autenticazione (email, eventuale password con hash).
            </li>
            <li>
              Demografia opzionale (anno di nascita, lingua madre, livello
              scolare, neurodivergenza autodichiarata) per migliorare la
              calibrazione del campione.
            </li>
            <li>
              Risposte ai task e tempi di reazione, per il calcolo del profilo
              e dell&apos;ICL.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy">
            Consenso ricerca, opzionale
          </h2>
          <p>
            Con il tuo consenso, parte dei tuoi dati viene anonimizzata in modo
            non reversibile e inclusa nel dataset di ricerca. Il consenso è
            revocabile in qualsiasi momento; le tue sessioni vengono escluse
            dal dataset analitico al primo aggiornamento successivo alla
            revoca.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy">I tuoi diritti</h2>
          <p>
            Puoi esportare i tuoi dati personali, correggerli, cancellarli, e
            opporti al trattamento per fini di ricerca. La cancellazione
            dell&apos;account innesca un purge differito; il dataset di ricerca
            anonimizzato non è riconducibile a te.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy">
            Hosting e regione dati
          </h2>
          <p>Hosting Railway in regione UE.</p>
        </section>
      </div>
    </PageShell>
  );
}
