import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { runScoringForSession } from "@/server/scoring-pipeline";
import { RadarChart } from "@/components/results/radar-chart";
import { IclDisplay } from "@/components/results/icl-display";
import {
  closingNarrative,
  generateAllNarratives,
  openingNarrative,
} from "@/lib/narrative/factor-narrative";
import { FACTOR_CODES, type FactorCode } from "@/types/scoring";

const FACTOR_TITLE: Record<FactorCode, string> = {
  Gf: "Ragionamento fluido",
  Gwm: "Memoria di lavoro",
  Gs: "Velocità di elaborazione",
  Gv: "Elaborazione visuospaziale",
  Gc: "Conoscenza cristallizzata",
};

export const metadata = { title: "La tua restituzione" };

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const auth = await requireUser();

  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    include: {
      factorScores: true,
      compositeScore: true,
      taskInstances: true,
    },
  });
  if (!session || session.userId !== auth.user.id) notFound();

  // Se la sessione e completata ma manca lo scoring, eseguilo ora.
  if (
    session.status === "completed" &&
    session.factorScores.length === 0
  ) {
    await runScoringForSession(sessionId);
    return ResultsPage({ params });
  }

  if (session.status !== "completed") {
    return (
      <PageShell title="Sessione in corso" maxWidth="md">
        <p className="text-foreground-muted">
          Questa sessione non è ancora stata finalizzata.
        </p>
        <Link
          href="/assessment"
          className="mt-6 inline-flex rounded-md bg-navy px-6 py-3 text-base font-medium text-white hover:bg-navy-soft"
        >
          Continua la sessione
        </Link>
      </PageShell>
    );
  }

  const factorZ: Record<FactorCode, number> = {
    Gf: 0, Gwm: 0, Gs: 0, Gv: 0, Gc: 0,
  };
  for (const fs of session.factorScores) {
    factorZ[fs.factor as FactorCode] = fs.zScore;
  }

  const narratives = generateAllNarratives(factorZ);
  const opening = openingNarrative();
  const closing = closingNarrative(factorZ);

  return (
    <PageShell title="La tua restituzione" maxWidth="lg">
      <div className="space-y-12">
        {/* Apertura */}
        <section className="prose max-w-none">
          <p className="text-lg leading-relaxed text-navy">{opening}</p>
        </section>

        {/* ICL o disclaimer QC */}
        {session.compositeScore ? (
          <IclDisplay
            icl={session.compositeScore.icl}
            se={session.compositeScore.se}
            lowerCI={session.compositeScore.lowerCI}
            upperCI={session.compositeScore.upperCI}
          />
        ) : (
          <QcWarning flags={(session.qcFlags as string[]) ?? []} />
        )}

        {/* Radar */}
        <section className="rounded-lg border border-border bg-surface p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-navy">
            Profilo a cinque dimensioni
          </h2>
          <p className="mt-2 text-sm text-foreground-muted">
            La forma del tuo pensiero, oggi. Niente gerarchia, solo geografia.
          </p>
          <div className="mt-6 flex justify-center">
            <RadarChart factorZScores={factorZ} size={420} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            {FACTOR_CODES.map((f) => (
              <div
                key={f}
                className="rounded-md border border-border bg-surface-soft p-3"
              >
                <div className="font-mono text-xs text-teal">{f}</div>
                <div className="text-navy">{FACTOR_TITLE[f]}</div>
                <div className="mt-1 text-xs text-foreground-muted">
                  z = {factorZ[f].toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Narrative per fattore */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-navy">
            Dettaglio per dimensione
          </h2>
          {narratives.map((n) => (
            <article
              key={n.factor}
              className="rounded-lg border border-border bg-surface p-6"
            >
              <div className="flex items-baseline gap-3">
                <h3 className="text-lg font-semibold text-navy">
                  {FACTOR_TITLE[n.factor]}
                </h3>
                <span className="font-mono text-xs text-teal">{n.factor}</span>
                <span className="text-xs text-foreground-muted">
                  z = {factorZ[n.factor].toFixed(2)}
                </span>
              </div>
              <p className="mt-3 leading-relaxed text-foreground-muted">
                {n.text}
              </p>
            </article>
          ))}
        </section>

        {/* Chiusura */}
        <section className="rounded-lg border border-teal/30 bg-teal/5 p-6">
          <p className="leading-relaxed text-navy">{closing}</p>
        </section>

        {/* Footer */}
        <footer className="rounded-md border border-border bg-surface-soft p-4 text-xs text-foreground-muted">
          <p>
            Lume non è un test del QI, non è uno strumento diagnostico, non
            sostituisce valutazioni cliniche professionali. Per dubbi clinici
            rivolgiti a un professionista. La presente restituzione si riferisce
            alla sessione completata il{" "}
            {session.completedAt?.toLocaleDateString("it-IT")} con app version{" "}
            {session.appVersion} e versione consenso {session.consentVersion}.
          </p>
          <p className="mt-2">
            Sessione: <code className="font-mono">{session.id.slice(0, 8)}</code>
          </p>
        </footer>
      </div>
    </PageShell>
  );
}

function QcWarning({ flags }: { flags: string[] }) {
  const human: Record<string, string> = {
    RT_IMPOSSIBLY_FAST: "Tempi di risposta molto rapidi che hanno superato la soglia di plausibilità in alcuni task.",
    UNIFORM_RESPONSE_PATTERN: "Pattern di risposta troppo uniforme in almeno un task.",
    INSUFFICIENT_TASK_COMPLETION: "Non tutti gli undici task sono stati completati.",
    ABANDONMENT: "La sessione è stata interrotta prima del primo task.",
  };
  return (
    <section
      className="rounded-lg border border-yellow-200 bg-yellow-50 p-6"
      aria-label="Quality control fallito"
    >
      <h2 className="text-lg font-semibold text-yellow-900">
        Restituzione parziale
      </h2>
      <p className="mt-2 text-sm text-yellow-900">
        Per questa sessione il quality control non è passato. Riceverai
        comunque il profilo a cinque dimensioni, ma non viene calcolato
        l&apos;ICL. Puoi ripetere la sessione in un altro momento.
      </p>
      {flags.length > 0 && (
        <ul className="mt-3 list-disc pl-5 text-sm text-yellow-900">
          {flags.map((f) => (
            <li key={f}>{human[f] ?? f}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
