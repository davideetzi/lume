import { PageShell } from "@/components/ui/page-shell";

export const metadata = { title: "Sul consenso" };

export default function ConsentInfoPage() {
  return (
    <PageShell
      title="Sul consenso"
      intro="Lume è uno strumento di autoesplorazione orientativa. Prima di iniziare ti chiediamo due consensi distinti."
    >
      <div className="space-y-8 text-foreground-muted">
        <section>
          <h2 className="text-lg font-semibold text-navy">
            Consenso al servizio, necessario
          </h2>
          <p>
            Per poter usare Lume e ricevere il tuo profilo, devi acconsentire
            al trattamento dei dati strettamente necessario all&apos;erogazione
            del servizio. Senza questo consenso non possiamo salvare le tue
            risposte né calcolare il tuo profilo.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy">
            Consenso alla ricerca, opzionale
          </h2>
          <p>
            Con il tuo consenso aggiuntivo, parte dei tuoi dati può essere
            anonimizzata e inclusa nel dataset di ricerca Humanev. La
            anonimizzazione è non reversibile: identità e dati di sessione
            vengono separati tramite un identificativo surrogato. Il dataset
            ricerca è privato di email, IP, e di ogni metadato che possa
            ricondurre a te.
          </p>
          <p className="mt-3">
            Questa scelta è del tutto opzionale e non influisce sul servizio
            che ricevi. Puoi revocare il consenso in qualsiasi momento dalle
            impostazioni del tuo account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy">
            Cosa Lume non fa con i tuoi dati
          </h2>
          <ul className="list-disc pl-6">
            <li>
              Non vende i tuoi dati a terze parti, mai, in nessuna forma.
            </li>
            <li>
              Non usa i tuoi dati per profilazione pubblicitaria di alcun
              tipo.
            </li>
            <li>
              Non condivide i tuoi dati con datori di lavoro, recruiter,
              agenzie del personale.
            </li>
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
