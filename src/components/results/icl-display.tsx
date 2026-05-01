type Props = {
  icl: number;
  se: number;
  lowerCI: number;
  upperCI: number;
};

/**
 * Mostra l'Indice Cognitivo Composito Lume con banda di confidenza
 * e disclaimer obbligatorio (sezione 5.4.4 + 8.2 della specifica).
 *
 * Vincoli applicati:
 *  - mai chiamato QI
 *  - mai senza banda di confidenza
 *  - mai senza disclaimer "score interno al campione"
 */
export function IclDisplay({ icl, se, lowerCI, upperCI }: Props) {
  return (
    <section
      className="rounded-lg border border-border bg-surface p-8 shadow-sm"
      aria-label="Indice Cognitivo Composito Lume"
    >
      <p className="text-xs font-mono uppercase tracking-widest text-teal">
        ICL · Indice Cognitivo Composito Lume
      </p>
      <div className="mt-3 flex items-baseline gap-3">
        <span className="text-6xl font-semibold text-navy">
          {icl.toFixed(0)}
        </span>
        <span className="text-lg text-foreground-muted">
          ± {se.toFixed(1)}
        </span>
      </div>
      <p className="mt-2 text-sm text-foreground-muted">
        Intervallo di stima: <strong className="text-navy">{lowerCI.toFixed(0)} – {upperCI.toFixed(0)}</strong>
      </p>

      <Bar icl={icl} lowerCI={lowerCI} upperCI={upperCI} />

      <div className="mt-6 rounded-md border border-border bg-surface-soft p-4 text-sm text-foreground-muted">
        <p>
          <strong className="text-navy">Importante.</strong> L&apos;ICL è uno
          score interno al campione di chi ha completato Lume fino a oggi.
          Non è un QI normato sulla popolazione italiana. La forma del tuo
          profilo a cinque dimensioni resta il segnale primario.
        </p>
      </div>
    </section>
  );
}

function Bar({
  icl,
  lowerCI,
  upperCI,
}: {
  icl: number;
  lowerCI: number;
  upperCI: number;
}) {
  const min = 40;
  const max = 160;
  const range = max - min;
  const pct = (v: number) => ((v - min) / range) * 100;
  return (
    <div className="mt-6">
      <div className="relative h-3 rounded-full bg-surface-soft">
        <div
          className="absolute h-3 rounded-full bg-teal/30"
          style={{
            left: `${pct(lowerCI)}%`,
            width: `${pct(upperCI) - pct(lowerCI)}%`,
          }}
        />
        <div
          className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded bg-navy"
          style={{ left: `${pct(icl)}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-foreground-muted">
        <span>40</span>
        <span>100</span>
        <span>160</span>
      </div>
    </div>
  );
}
