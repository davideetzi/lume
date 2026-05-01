# 0003 - Generazione procedurale degli item vs item bank statico

Status: accepted
Data: 2026-05-01

## Contesto

Lume ha 11 task. Alcuni si prestano a generazione procedurale (matrici figurali, serie, n-back, symbol matching, mental rotation, paper folding), altri richiedono curation linguistica esperta (vocabolario, inferenze verbali). La scelta influenza riproducibilità, calibrazione IRT, esposizione dell'utente a item ripetuti.

## Decisione

- **Generazione procedurale per Gf, Gv, Gs e parte di Gwm**: matrici, serie, n-back, symbol-match, mental rotation, paper folding. Item generati a runtime da seed deterministico salvato nel `Trial.itemSeed`. Vantaggi: nessun item bank da curare, infinite varianti, copertura uniforme delle regole compositive, riproducibilità completa per debug e analisi psicometrica.
- **Item bank statico per Gc**: vocabolario e inferenze verbali. Curation umana necessaria per garantire correttezza linguistica, livello di difficoltà, equità per livello scolare. Item versionati con `ItemBankEntry.version`, calibrabili IRT su dati raccolti.
- **Banche miste per Gwm**: span e Corsi sono adattivi (sequenze generate proceduralmente con state machine), n-back è puramente procedurale.

## Item bank Gc in v0.1: DRAFT

Per il MVP, l'item bank di vocabolario (32 item) e inferenze verbali (24 item) è una bozza generata da Claude Code, marcata `draft: true` nel JSON content. La specifica sezione 13.3 vincola Claude Code a fornire solo prima draft, mai versione finale. Prima del lancio commerciale e di qualsiasi studio normativo, gli item devono essere rivisti da uno psicologo, calibrati per livello scolare, controllati per bias culturale.

La pipeline di scoring ha un campo `details.draftItemBank` su TaskInstance che permette di tracciare quali sessioni hanno usato bank draft. In v2 questo flag può essere usato per escludere quelle sessioni dal calcolo normativo o per pesarle in modo diverso.

## Riproducibilità

- Ogni Trial salva `itemSeed` (string) usata per generare l'item.
- I generatori procedurali sono funzioni pure: stessa seed → stesso item.
- PRNG mulberry32 deterministico, non dipende da Math.random.
- Per gli item bank, salvo `externalId` (es. "voc-001") che resta stabile attraverso le versioni.

## Conseguenze

- I task Gf, Gs, Gv, Gwm non richiedono curation per il MVP.
- Il task Gc richiede una sessione di lavoro con Davide o un collaboratore psicologo prima del lancio.
- Le analisi psicometriche post-raccolta dati (alpha di Cronbach, IRT) sono possibili su tutti i task perché la difficoltà e i parametri di item sono salvati in `Trial.itemMeta`.
