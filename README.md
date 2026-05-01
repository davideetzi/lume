# Lume

> Un ritratto dei tuoi processi cognitivi.

Lume è una batteria cognitiva computerizzata orientativa basata sul modello CHC (Cattell-Horn-Carroll). Restituisce un profilo descrittivo a cinque dimensioni e un Indice Cognitivo Composito Lume (ICL) accompagnato da banda di confidenza.

**Lume non è un test del QI, non è uno strumento diagnostico, non sostituisce valutazioni cliniche professionali.**

## Stack

| Layer | Tecnologia |
|---|---|
| Framework | Next.js 16 App Router + TypeScript strict |
| Styling | Tailwind CSS 4 |
| DB | PostgreSQL via Prisma 6 |
| Auth | NextAuth v5 (Auth.js), Credentials |
| Test | Vitest 4 |
| Hosting | Railway, regione UE |

## Setup locale

```bash
# Node 22 (nvm o Volta)
nvm use 22

# Installa
npm install

# Database (Postgres.app o Docker)
# Aggiorna DATABASE_URL in .env (vedi .env.example)
npm run db:migrate:dev
npm run db:seed   # carica item bank draft

# Dev
npm run dev
```

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Dev server su :3000 |
| `npm test` | Vitest, suite completa |
| `npm run build` | Build di produzione |
| `npm run db:migrate:dev` | Applica migration in dev |
| `npm run db:seed` | Carica item bank draft (vocabolario, inferenze) |
| `npm run db:studio` | Prisma Studio per ispezionare il DB |

## Architettura

### Modello dei dati

- `User`, `Account`, `AuthSession`, `VerificationToken`: NextAuth standard
- `ConsentRecord`: consenso versionato (servizio + ricerca), revocabile
- `AssessmentSession`: sessione di assessment, status, qcPassed, qcFlags
- `TaskInstance`: stato per-task dentro la sessione (not_started, in_progress, completed)
- `Trial`: ogni risposta a singolo item, con `itemSeed` per riproducibilità
- `ItemBankEntry`: item bank statico (vocabolario, inferenze verbali) con IRT params
- `FactorScore`: 5 righe per sessione (Gf, Gwm, Gs, Gv, Gc), z-score interno
- `CompositeScore`: ICL con SE, lowerCI, upperCI, qcPassed, formulaVersion
- `SampleStatBatch`, `SampleStat`: stats del campione per z-score (placeholder per v3 norme italiane)
- `ResearchExport`: pipeline anonimizzata, surrogateId non reversibile

### Catalogo task

11 task organizzati su 5 fattori CHC. Vedi [`src/lib/tasks/catalog.ts`](src/lib/tasks/catalog.ts).

| Fattore | Task | Tempo |
|---|---|---|
| Gf | Matrici figurali, Serie figurali | ~16 min |
| Gwm | Span numerico inverso, Corsi, N-back 2 | ~13 min |
| Gs | Symbol matching, Choice RT | ~4 min |
| Gv | Rotazione mentale 3D, Paper folding | ~13 min |
| Gc | Vocabolario, Inferenze verbali | ~14 min |

### ICL e formula

Vedi [`src/lib/scoring/composite.ts`](src/lib/scoring/composite.ts) e [`tests/scoring/composite.test.ts`](tests/scoring/composite.test.ts).

**Formula v1**: `ICL = 100 + 20 × media(z_Gf, z_Gwm, z_Gs, z_Gv, z_Gc)` con troncamento a [40, 160] e SE = 6 (v1 fisso, v2 da alpha empirico).

**Vincoli mai derogati**:

- ICL mai chiamato QI in v1 e v2
- ICL sempre con banda di confidenza
- ICL accompagnato sempre dal profilo a 5 fattori
- Sessioni con QC negativo non producono ICL
- Età minima 18, esclusione contrattuale uso in selezione del personale

### Gating route

[`src/proxy.ts`](src/proxy.ts) protegge `/assessment`, `/results`, `/account`, `/onboarding` (richiede auth). Le pagine eseguono `requireConsent()` server-side per il gating sul consenso.

## Test

```bash
npm test
```

| Suite | Focus |
|---|---|
| `tests/scoring/composite.test.ts` | computeICL, troncamento, banda, validazione pesi/SE, seFromAlpha |
| `tests/scoring/qc.test.ts` | evaluateQc, RT impossibilmente bassi, pattern uniforme, abandonment |
| `tests/items/seed.test.ts` | mulberry32, rngFromString determinismo, helper |
| `tests/items/matrix.test.ts` | generatore matrici, regole, distrattori, riproducibilità |
| `tests/items/digit-span.test.ts` | sequenza senza ripetizioni, state machine adattiva |

## Item bank (DRAFT)

L'item bank di vocabolario (32) e inferenze verbali (24) è una **bozza generata da Claude Code**. Prima del lancio commerciale e prima di qualsiasi studio normativo deve essere rivisto da uno psicologo, calibrato per livello scolare, controllato per bias culturale, ed eventualmente sostituito con item curati. Vedi [`prisma/seed.ts`](prisma/seed.ts) e sezione 13.3 della specifica Lume.

Tutti gli item draft hanno flag `draft: true` nel JSON `content`. La pipeline di scoring v2 può escludere item draft dal calcolo normativo.

## Deploy su Railway

1. Crea progetto Railway con Postgres add-on, regione UE
2. Connetti la repo, build automatico via `railway.json`
3. Variabili d'ambiente:
   - `DATABASE_URL` (provided dal plugin Postgres)
   - `AUTH_SECRET` (genera con `openssl rand -base64 32`)
   - `AUTH_URL` (URL pubblico del deployment)
   - `NEXT_PUBLIC_CONSENT_VERSION` (es. `2026-05-01`)
   - `NEXT_PUBLIC_APP_VERSION` (semver)
4. Prima deploy applica le migration tramite `prisma migrate deploy` automaticamente

## Roadmap

| Versione | Stato |
|---|---|
| v0.1 MVP tecnico | Tutti gli 11 task end-to-end, scoring + ICL, deploy-ready |
| v0.5 Pilot | Refinement post-feedback, item bank Gc curato, 50-100 utenti |
| v1.0 Lancio | Magic link email, payment Stripe, monitoring Sentry, analytics Plausible |
| v2.0 Insight | Calibrazione IRT, AI-assisted narratives, dashboard B2B |
| v3.0 Norme | 5000+ sessioni, transizione a ICL su norme italiane (QI con disclaimer) |

## Documenti di riferimento

- Specifica scientifico-tecnica e brief operativo (documento di progetto Humanev)
- [`docs/decisions/`](docs/decisions/) — Architecture Decision Records

## Licenza e proprietà

Proprietario: Humanev. Davide Etzi. Tutti i diritti riservati. Uso non autorizzato vietato.
# lume
