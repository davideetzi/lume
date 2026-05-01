# 0001 - Stack tecnologico

Status: accepted
Data: 2026-05-01

## Contesto

Lume è una webapp Humanev, parte di un ecosistema con altri sottodomini (HDPA, Cambi di Rotta, Maestria Osmotica) di cui alcuni sono Vercel-hosted Next.js e altri sono Flask-Python su Railway. Per Lume serve uno stack che supporti type safety stretta sui dati psicometrici, server-side rendering per le pagine pubbliche, e logica client-side ricca per i task interattivi.

## Decisione

- **Next.js 16 App Router + TypeScript strict**: SSR per la landing pubblica, server actions per le mutazioni, client components per i task. App Router perché stabile con React 19, e perché la coerenza con altri progetti Humanev frontend Vercel agevola il context-switching.
- **Tailwind CSS 4**: stile coerente con il sistema Humanev tramite token CSS vars, niente design system pesante.
- **Prisma 6 + PostgreSQL**: schema migrabile, type-safe, consistente con HDPA, supporta JSON columns per item content.
- **NextAuth v5 (Auth.js)**: standard riconosciuto, integrato con Prisma adapter, supporta credentials e magic link email.
- **Vitest 4**: più veloce di Jest, integrazione TS nativa, comodo per i test di funzioni pure (scoring, generatori procedurali).
- **Railway regione UE**: coerente con HDPA, GDPR-friendly, autoscaling sufficiente per v0.1.

## Alternative scartate

- **Remix**: meno familiare nell'ecosistema Humanev, vantaggi marginali rispetto a Next.js per questo caso d'uso.
- **Drizzle**: più snella di Prisma ma non offriva sufficiente vantaggio rispetto ai migration tooling già padroneggiati.
- **Vercel hosting**: scelto Railway per consistenza con HDPA e perché il pricing scala meglio sotto carico variabile.

## Conseguenze

- Type safety end-to-end su Trial, FactorScore, ICL.
- Server actions per le mutazioni, niente API REST esposte.
- Postgres come singola fonte di verità: stati TaskInstance + Trial + ConsentRecord versionato + ResearchExport.
