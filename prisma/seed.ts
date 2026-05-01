import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * IMPORTANTE: questo item bank e una bozza generata da Claude Code.
 * Prima del lancio commerciale (e prima di ogni studio normativo) deve
 * essere rivisto da uno psicologo, calibrato per livello scolare,
 * controllato per bias, ed eventualmente sostituito con item curati.
 * Vedi sezione 13.3 della specifica Lume.
 *
 * Ogni item ha externalId stabile e flag draft = true. La pipeline di
 * scoring puo escludere item draft dal calcolo normativo.
 */

type VocabItem = {
  externalId: string;
  word: string;
  options: string[]; // 4, la prima e la corretta
  difficultyTier: 1 | 2 | 3; // 1 = base, 2 = medio, 3 = avanzato
};

type VerbalInferenceItem = {
  externalId: string;
  // analogia: a sta a b come c sta a ?
  a: string;
  b: string;
  c: string;
  options: string[]; // 4, la prima e la corretta
  relation: string; // descrittore della relazione (per debug, non mostrato)
  difficultyTier: 1 | 2 | 3;
};

const VOCAB_DRAFT: VocabItem[] = [
  // Tier 1
  { externalId: "voc-001", word: "abituale", options: ["consueto", "raro", "improvviso", "fragile"], difficultyTier: 1 },
  { externalId: "voc-002", word: "robusto", options: ["resistente", "morbido", "leggero", "incerto"], difficultyTier: 1 },
  { externalId: "voc-003", word: "tacito", options: ["non detto", "rumoroso", "veloce", "evidente"], difficultyTier: 1 },
  { externalId: "voc-004", word: "esiguo", options: ["scarso", "abbondante", "generoso", "aperto"], difficultyTier: 1 },
  { externalId: "voc-005", word: "celare", options: ["nascondere", "mostrare", "scegliere", "interrogare"], difficultyTier: 1 },
  { externalId: "voc-006", word: "lieto", options: ["contento", "amaro", "stanco", "esitante"], difficultyTier: 1 },
  { externalId: "voc-007", word: "amaro", options: ["aspro", "dolce", "morbido", "umido"], difficultyTier: 1 },
  { externalId: "voc-008", word: "trepido", options: ["agitato", "calmo", "freddo", "lieve"], difficultyTier: 1 },
  { externalId: "voc-009", word: "saldo", options: ["fermo", "incerto", "molle", "transitorio"], difficultyTier: 1 },
  { externalId: "voc-010", word: "transitorio", options: ["passeggero", "stabile", "antico", "luminoso"], difficultyTier: 1 },
  // Tier 2
  { externalId: "voc-011", word: "perspicace", options: ["acuto", "ingenuo", "lento", "distratto"], difficultyTier: 2 },
  { externalId: "voc-012", word: "ridondante", options: ["superfluo", "essenziale", "scarno", "preciso"], difficultyTier: 2 },
  { externalId: "voc-013", word: "succinto", options: ["breve", "verboso", "ricco", "ambiguo"], difficultyTier: 2 },
  { externalId: "voc-014", word: "ostico", options: ["difficile", "facile", "morbido", "neutro"], difficultyTier: 2 },
  { externalId: "voc-015", word: "estroso", options: ["fantasioso", "comune", "rigido", "anonimo"], difficultyTier: 2 },
  { externalId: "voc-016", word: "tedioso", options: ["noioso", "vivace", "intenso", "delicato"], difficultyTier: 2 },
  { externalId: "voc-017", word: "ineludibile", options: ["inevitabile", "evitabile", "facoltativo", "ipotetico"], difficultyTier: 2 },
  { externalId: "voc-018", word: "deferenza", options: ["rispetto", "indifferenza", "ostilita", "casualita"], difficultyTier: 2 },
  { externalId: "voc-019", word: "esimere", options: ["dispensare", "obbligare", "imporre", "trattenere"], difficultyTier: 2 },
  { externalId: "voc-020", word: "consesso", options: ["assemblea", "isolamento", "dispersione", "anonimato"], difficultyTier: 2 },
  // Tier 3
  { externalId: "voc-021", word: "lapidario", options: ["essenziale e netto", "vago", "ridondante", "decorativo"], difficultyTier: 3 },
  { externalId: "voc-022", word: "ineffabile", options: ["indicibile", "comune", "definito", "esplicito"], difficultyTier: 3 },
  { externalId: "voc-023", word: "edulcorare", options: ["addolcire", "inasprire", "complicare", "occultare"], difficultyTier: 3 },
  { externalId: "voc-024", word: "obsoleto", options: ["superato", "moderno", "necessario", "raro"], difficultyTier: 3 },
  { externalId: "voc-025", word: "perentorio", options: ["definitivo", "esitante", "ipotetico", "fragile"], difficultyTier: 3 },
  { externalId: "voc-026", word: "dirimente", options: ["risolutivo", "irrilevante", "ambiguo", "casuale"], difficultyTier: 3 },
  { externalId: "voc-027", word: "fervido", options: ["intenso", "tiepido", "indifferente", "spento"], difficultyTier: 3 },
  { externalId: "voc-028", word: "ineluttabile", options: ["inevitabile", "evitabile", "incerto", "previsto"], difficultyTier: 3 },
  { externalId: "voc-029", word: "stigmatizzare", options: ["condannare apertamente", "approvare", "ignorare", "difendere"], difficultyTier: 3 },
  { externalId: "voc-030", word: "esegesi", options: ["interpretazione", "censura", "sintesi", "indifferenza"], difficultyTier: 3 },
  { externalId: "voc-031", word: "epigono", options: ["seguace", "iniziatore", "rivale", "critico"], difficultyTier: 3 },
  { externalId: "voc-032", word: "abrogare", options: ["annullare", "promulgare", "confermare", "estendere"], difficultyTier: 3 },
];

const VERBAL_DRAFT: VerbalInferenceItem[] = [
  // Tier 1 (causa, parte, opposto, funzione, categoria)
  { externalId: "vi-001", a: "fame", b: "cibo", c: "sete", options: ["acqua", "aria", "luce", "calore"], relation: "causa->soluzione", difficultyTier: 1 },
  { externalId: "vi-002", a: "ruota", b: "auto", c: "ala", options: ["aereo", "albero", "porta", "scarpa"], relation: "parte->insieme", difficultyTier: 1 },
  { externalId: "vi-003", a: "alto", b: "basso", c: "veloce", options: ["lento", "stanco", "agile", "fermo"], relation: "opposto", difficultyTier: 1 },
  { externalId: "vi-004", a: "penna", b: "scrivere", c: "forbice", options: ["tagliare", "leggere", "incollare", "misurare"], relation: "strumento->funzione", difficultyTier: 1 },
  { externalId: "vi-005", a: "rosa", b: "fiore", c: "quercia", options: ["albero", "frutto", "legno", "foglia"], relation: "specifico->categoria", difficultyTier: 1 },
  { externalId: "vi-006", a: "freddo", b: "caldo", c: "buio", options: ["luce", "ombra", "notte", "stella"], relation: "opposto", difficultyTier: 1 },
  { externalId: "vi-007", a: "uovo", b: "uccello", c: "seme", options: ["pianta", "frutto", "terra", "acqua"], relation: "origine->prodotto", difficultyTier: 1 },
  { externalId: "vi-008", a: "ape", b: "miele", c: "mucca", options: ["latte", "lana", "uovo", "carne"], relation: "produttore->prodotto", difficultyTier: 1 },
  // Tier 2
  { externalId: "vi-009", a: "medico", b: "ospedale", c: "insegnante", options: ["scuola", "ufficio", "studio", "biblioteca"], relation: "ruolo->luogo di lavoro", difficultyTier: 2 },
  { externalId: "vi-010", a: "musicista", b: "orchestra", c: "attore", options: ["compagnia", "teatro", "regista", "platea"], relation: "ruolo->collettivo", difficultyTier: 2 },
  { externalId: "vi-011", a: "minuto", b: "ora", c: "secondo", options: ["minuto", "giorno", "tempo", "istante"], relation: "unita minore->unita maggiore", difficultyTier: 2 },
  { externalId: "vi-012", a: "neve", b: "bianco", c: "carbone", options: ["nero", "grigio", "rosso", "scuro"], relation: "oggetto->colore tipico", difficultyTier: 2 },
  { externalId: "vi-013", a: "scrittore", b: "libro", c: "regista", options: ["film", "scena", "luce", "premio"], relation: "autore->opera", difficultyTier: 2 },
  { externalId: "vi-014", a: "errore", b: "correzione", c: "ferita", options: ["cura", "medicina", "dolore", "cicatrice"], relation: "problema->risposta", difficultyTier: 2 },
  { externalId: "vi-015", a: "cucinare", b: "fame", c: "dormire", options: ["stanchezza", "riposo", "letto", "sogno"], relation: "azione->bisogno risolto", difficultyTier: 2 },
  { externalId: "vi-016", a: "domanda", b: "risposta", c: "saluto", options: ["risposta", "addio", "conversazione", "incontro"], relation: "iniziativa->reazione attesa", difficultyTier: 2 },
  // Tier 3
  { externalId: "vi-017", a: "metallo", b: "fonderia", c: "vino", options: ["cantina", "vigna", "bicchiere", "etichetta"], relation: "materia->luogo di lavorazione", difficultyTier: 3 },
  { externalId: "vi-018", a: "abbondanza", b: "scarsita", c: "luce", options: ["oscurita", "ombra", "calore", "buio"], relation: "opposto astratto", difficultyTier: 3 },
  { externalId: "vi-019", a: "germoglio", b: "albero", c: "neonato", options: ["adulto", "bambino", "famiglia", "nome"], relation: "stadio iniziale->stadio maturo", difficultyTier: 3 },
  { externalId: "vi-020", a: "sintomo", b: "malattia", c: "indizio", options: ["crimine", "verita", "testimone", "investigatore"], relation: "manifestazione->causa", difficultyTier: 3 },
  { externalId: "vi-021", a: "intuizione", b: "verifica", c: "ipotesi", options: ["esperimento", "teoria", "premessa", "domanda"], relation: "primo passo->conferma", difficultyTier: 3 },
  { externalId: "vi-022", a: "stagione", b: "anno", c: "movimento", options: ["sinfonia", "danza", "ritmo", "scena"], relation: "parte->opera complessiva", difficultyTier: 3 },
  { externalId: "vi-023", a: "aspirazione", b: "obiettivo", c: "abbozzo", options: ["progetto", "scarabocchio", "schizzo", "modello"], relation: "informe->definito", difficultyTier: 3 },
  { externalId: "vi-024", a: "preludio", b: "sinfonia", c: "introduzione", options: ["saggio", "indice", "epilogo", "titolo"], relation: "apertura->opera", difficultyTier: 3 },
];

async function main() {
  // Vocabolario
  let voc = 0;
  for (const item of VOCAB_DRAFT) {
    await prisma.itemBankEntry.upsert({
      where: {
        taskCode_externalId_version: {
          taskCode: "vocabulary",
          externalId: item.externalId,
          version: 1,
        },
      },
      update: {
        content: {
          word: item.word,
          options: item.options,
          draft: true,
        },
        difficultyTier: item.difficultyTier,
        active: true,
      },
      create: {
        taskCode: "vocabulary",
        externalId: item.externalId,
        version: 1,
        content: {
          word: item.word,
          options: item.options,
          draft: true,
        },
        difficultyTier: item.difficultyTier,
        active: true,
      },
    });
    voc++;
  }

  // Inferenze verbali
  let vi = 0;
  for (const item of VERBAL_DRAFT) {
    await prisma.itemBankEntry.upsert({
      where: {
        taskCode_externalId_version: {
          taskCode: "verbal_inference",
          externalId: item.externalId,
          version: 1,
        },
      },
      update: {
        content: {
          a: item.a,
          b: item.b,
          c: item.c,
          options: item.options,
          relation: item.relation,
          draft: true,
        },
        difficultyTier: item.difficultyTier,
        active: true,
      },
      create: {
        taskCode: "verbal_inference",
        externalId: item.externalId,
        version: 1,
        content: {
          a: item.a,
          b: item.b,
          c: item.c,
          options: item.options,
          relation: item.relation,
          draft: true,
        },
        difficultyTier: item.difficultyTier,
        active: true,
      },
    });
    vi++;
  }

  console.log(`Seeded ${voc} vocabulary + ${vi} verbal inference items (DRAFT)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
