import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";
import { requireConsent } from "@/lib/auth-guards";

export const metadata = { title: "Come funziona" };

export default async function OnboardingPage() {
  await requireConsent();

  return (
    <PageShell
      title="Come funziona"
      intro="Lume si svolge in undici brevi attività, organizzate per esplorare cinque dimensioni cognitive. Tempo medio totale circa cinquanta minuti, con possibilità di sospensione e ripresa."
    >
      <div className="space-y-10">
        <section>
          <h2 className="text-xl font-semibold text-navy">
            Prima di iniziare
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground-muted">
            <li>Trova un ambiente tranquillo, senza interruzioni.</li>
            <li>Schermo pulito, browser aggiornato, audio attivo.</li>
            <li>
              Non c&apos;è una soglia da superare. Procedi con la cadenza che
              senti più tua.
            </li>
            <li>Le sessioni completate alimentano un profilo descrittivo.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy">Cosa riceverai</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground-muted">
            <li>
              Un profilo a cinque dimensioni con paragrafi narrativi per
              fattore.
            </li>
            <li>
              Un Indice Cognitivo Composito Lume (ICL) con banda di confidenza,
              come sintesi leggibile del profilo.
            </li>
            <li>
              Un PDF scaricabile, riservato a te, da rileggere con calma.
            </li>
          </ul>
          <p className="mt-4 text-sm text-foreground-muted">
            L&apos;ICL non è un QI normato. È uno score interno al campione
            Lume, accompagnato sempre dal profilo a cinque fattori e da una
            lettura qualitativa.
          </p>
        </section>

        <Link
          href="/assessment"
          className="inline-flex rounded-md bg-navy px-6 py-3 text-base font-medium text-white hover:bg-navy-soft"
        >
          Vai alla sessione
        </Link>
      </div>
    </PageShell>
  );
}
