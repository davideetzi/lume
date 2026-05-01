# 0002 - Scala ICL e transizione futura a QI

Status: accepted
Data: 2026-05-01

## Contesto

La specifica Lume sezione 5.4 richiede di restituire un indice composito unico, ma di non chiamarlo QI fino a quando non ci saranno norme italiane (5000+ sessioni stratificate). Allo stesso tempo, l'utente medio si aspetta un numero leggibile e familiare. Serve una scala che funzioni in v1 (campione interno autoselezionato) e che possa transitare a QI standard 100±15 in v3 senza rotture.

## Decisione

- **Scala v1 e v2**: 100±20, range pratico [40, 160] con troncamento.
- **Nome**: ICL, Indice Cognitivo Composito Lume. Mai chiamato QI in copy, codice, marketing.
- **Formula v1**: media non pesata degli z-score dei 5 fattori, scalata a 100+20×z.
- **Banda di confidenza obbligatoria**: SE = 6 fisso in v1 (in attesa di stima empirica da alpha del composito, che richiede dati). Mostrato sempre come `ICL ± SE` con `[lowerCI, upperCI]`.
- **Vincolo prodotto**: l'ICL non viene mai mostrato senza il profilo a 5 fattori e senza il disclaimer "score interno al campione, non un QI normato".
- **Quality control**: sessioni con qcFlags non producono ICL, solo profilo.

## Transizione a v3

In v3, quando il dataset normativo italiano supererà le 5000 sessioni stratificate per età e livello scolare, la stessa pipeline ricalibrerà l'ICL sulle norme nazionali e potrà presentarlo come QI standard 100±15. La transizione è già scritta nello schema dati (`SampleStatBatch` versionati, `formulaVersion` tracciato in `CompositeScore`).

## Alternative scartate

- **Percentili diretti** (es. "75° percentile"): meno familiari del numero scala QI, più ambigui ("75 di cosa?").
- **Tier categorici** (es. "Sotto la media / Media / Sopra la media"): perde granularità e tradisce lo spirito di un indice continuo.
- **QI 100±15 da subito**: violerebbe la deontologia perché il campione Lume v1 non è normativo.

## Conseguenze

- Audit di copy ricorrente per assicurarsi che "QI" non compaia mai in v1 e v2.
- L'utente vede un numero familiare ma viene istruito esplicitamente sulla differenza tra ICL interno e QI normato.
- Quando si attiverà la transizione in v3, basterà cambiare formulaVersion e ricalcolare con norme italiane, senza modifiche utente-facing al UI principale (cambia solo il disclaimer).
