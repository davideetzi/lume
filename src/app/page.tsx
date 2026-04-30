import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
          <p className="mb-6 text-sm font-medium uppercase tracking-widest text-teal">
            Humanev · Lume
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-navy sm:text-5xl">
            Un ritratto dei tuoi processi cognitivi.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-foreground-muted">
            Lume è una batteria cognitiva orientativa basata sul modello CHC.
            Restituisce un profilo descrittivo di come ragioni, ricordi,
            elabori, ruoti mentalmente lo spazio, e organizzi le tue
            conoscenze. Un ritratto, non un giudizio.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-md bg-navy px-6 py-3 text-base font-medium text-white hover:bg-navy-soft"
            >
              Inizia il tuo profilo
            </Link>
            <Link
              href="/onboarding"
              className="rounded-md border border-border bg-surface px-6 py-3 text-base font-medium text-navy hover:border-teal"
            >
              Come funziona
            </Link>
          </div>
          <p className="mt-10 max-w-2xl text-sm text-foreground-muted">
            Lume non è un test del QI. Non è uno strumento diagnostico. Non
            sostituisce valutazioni cliniche professionali. Per maggiori
            informazioni leggi la{" "}
            <Link href="/consent-info" className="underline hover:text-navy">
              pagina sul consenso
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-surface-soft">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-2xl font-semibold text-navy">
            Cinque dimensioni, una geografia
          </h2>
          <p className="mt-4 max-w-2xl text-foreground-muted">
            Il modello Cattell-Horn-Carroll organizza le abilità cognitive in
            fattori ampi. Lume ne restituisce cinque, esplorati con undici
            attività.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FactorCard
              code="Gf"
              title="Ragionamento fluido"
              body="Risolvere problemi nuovi, trovare regole, generare inferenze quando le conoscenze pregresse non aiutano."
            />
            <FactorCard
              code="Gwm"
              title="Memoria di lavoro"
              body="Trattenere e manipolare informazioni in tempo reale, mantenere il filo sotto richieste multiple."
            />
            <FactorCard
              code="Gs"
              title="Velocità di elaborazione"
              body="Eseguire operazioni cognitive semplici con cadenza rapida, sotto pressione temporale."
            />
            <FactorCard
              code="Gv"
              title="Elaborazione visuospaziale"
              body="Generare, ruotare, trasformare immagini mentali. Vedere lo spazio dentro la testa."
            />
            <FactorCard
              code="Gc"
              title="Conoscenza cristallizzata"
              body="Lessico, comprensione semantica, ampiezza e profondità delle conoscenze acquisite."
            />
          </ul>
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-foreground-muted">
          <p>© Humanev. Lume v0.1, working title.</p>
          <nav className="flex gap-6">
            <Link href="/tos" className="hover:text-navy">
              Termini
            </Link>
            <Link href="/privacy" className="hover:text-navy">
              Privacy
            </Link>
            <Link href="/consent-info" className="hover:text-navy">
              Consenso
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function FactorCard({
  code,
  title,
  body,
}: {
  code: string;
  title: string;
  body: string;
}) {
  return (
    <li className="rounded-lg border border-border bg-surface p-6">
      <p className="text-sm font-mono font-medium text-teal">{code}</p>
      <h3 className="mt-2 text-lg font-semibold text-navy">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
        {body}
      </p>
    </li>
  );
}
