import type { FactorCode } from "@/types/scoring";

export type TaskCode =
  | "matrix"
  | "series"
  | "digit_span_back"
  | "corsi"
  | "nback"
  | "symbol_match"
  | "choice_rt"
  | "mental_rotation"
  | "paper_folding"
  | "vocabulary"
  | "verbal_inference";

export type TaskDef = {
  code: TaskCode;
  factor: FactorCode;
  title: string;
  shortDesc: string;
  estimatedMinutes: number;
  // testo etziano breve mostrato in instructions
  instructions: string;
  // numero di trial nel blocco principale (se applicabile)
  blockSize?: number;
  // soft-cap secondi per trial (0 = no time pressure)
  softCapSec?: number;
};

/**
 * Ordine di somministrazione consigliato (sezione 6.6 della specifica):
 *   - apre con Gf (warm-up cognitivo, leggero)
 *   - alterna richieste cognitive per ridurre fatica
 *   - chiude con Gc (puramente verbale, riposante dopo gli sforzi visuospaziali)
 */
export const TASK_ORDER: TaskCode[] = [
  "matrix",
  "series",
  "digit_span_back",
  "corsi",
  "nback",
  "symbol_match",
  "choice_rt",
  "mental_rotation",
  "paper_folding",
  "vocabulary",
  "verbal_inference",
];

export const TASKS: Record<TaskCode, TaskDef> = {
  matrix: {
    code: "matrix",
    factor: "Gf",
    title: "Matrici figurali",
    shortDesc: "Trovare la regola che completa una griglia di figure.",
    estimatedMinutes: 10,
    blockSize: 20,
    softCapSec: 90,
    instructions:
      "Vedrai una griglia di figure con una casella mancante. Il tuo compito è scegliere, tra le opzioni, la figura che completa il pattern. Non c'è una soglia da superare: prenditi il tempo che serve.",
  },
  series: {
    code: "series",
    factor: "Gf",
    title: "Serie figurali",
    shortDesc: "Continuare un pattern di figure.",
    estimatedMinutes: 6,
    blockSize: 12,
    softCapSec: 60,
    instructions:
      "Vedrai una sequenza di figure che cambia secondo una regola. Scegli la figura che continua la serie.",
  },
  digit_span_back: {
    code: "digit_span_back",
    factor: "Gwm",
    title: "Memoria di cifre, ordine inverso",
    shortDesc: "Riprodurre cifre nell'ordine contrario.",
    estimatedMinutes: 5,
    instructions:
      "Vedrai una sequenza di cifre, una alla volta. Quando finisce, digitale nell'ordine inverso. La sequenza si allunga se rispondi correttamente.",
  },
  corsi: {
    code: "corsi",
    factor: "Gwm",
    title: "Memoria spaziale di posizioni",
    shortDesc: "Memorizzare e ripetere una sequenza di blocchi illuminati.",
    estimatedMinutes: 6,
    instructions:
      "Sullo schermo appariranno blocchi che si illuminano uno dopo l'altro. Quando la sequenza finisce, clicca i blocchi nello stesso ordine.",
  },
  nback: {
    code: "nback",
    factor: "Gwm",
    title: "Aggiornamento continuo (2-back)",
    shortDesc: "Premere quando lo stimolo coincide con quello di due passi prima.",
    estimatedMinutes: 2,
    blockSize: 30,
    instructions:
      "Vedrai una sequenza di lettere. Premi spazio ogni volta che la lettera attuale è uguale a quella mostrata due passi prima.",
  },
  symbol_match: {
    code: "symbol_match",
    factor: "Gs",
    title: "Confronto rapido di simboli",
    shortDesc: "Decidere se due simboli sono uguali, il più velocemente possibile.",
    estimatedMinutes: 2,
    blockSize: 60,
    softCapSec: 90,
    instructions:
      "Vedrai due simboli astratti. Premi un tasto se sono identici, l'altro se sono diversi. Vai rapido senza affrettarti.",
  },
  choice_rt: {
    code: "choice_rt",
    factor: "Gs",
    title: "Tempi di reazione su scelta multipla",
    shortDesc: "Premere il tasto della posizione in cui appare lo stimolo.",
    estimatedMinutes: 2,
    blockSize: 40,
    instructions:
      "Apparirà uno stimolo in una di quattro posizioni. Premi rapidamente il tasto corrispondente.",
  },
  mental_rotation: {
    code: "mental_rotation",
    factor: "Gv",
    title: "Rotazione mentale 3D",
    shortDesc: "Capire se due oggetti tridimensionali sono lo stesso ruotato.",
    estimatedMinutes: 7,
    blockSize: 20,
    softCapSec: 90,
    instructions:
      "Vedrai due figure tridimensionali fatte di cubi. Decidi se sono lo stesso oggetto ruotato, oppure due oggetti diversi (specchio).",
  },
  paper_folding: {
    code: "paper_folding",
    factor: "Gv",
    title: "Piegamento mentale",
    shortDesc: "Visualizzare un foglio piegato e perforato, poi aperto.",
    estimatedMinutes: 6,
    blockSize: 12,
    softCapSec: 90,
    instructions:
      "Un foglio viene piegato secondo una sequenza, poi perforato. Scegli come apparirà il foglio quando viene aperto.",
  },
  vocabulary: {
    code: "vocabulary",
    factor: "Gc",
    title: "Vocabolario",
    shortDesc: "Scegliere il significato corretto di una parola.",
    estimatedMinutes: 7,
    blockSize: 30,
    instructions:
      "Vedrai una parola e quattro possibili significati. Scegli quello che meglio rappresenta il significato della parola.",
  },
  verbal_inference: {
    code: "verbal_inference",
    factor: "Gc",
    title: "Inferenze verbali",
    shortDesc: "Completare analogie tra parole.",
    estimatedMinutes: 7,
    blockSize: 30,
    instructions:
      "Vedrai un'analogia incompleta del tipo «A sta a B come C sta a ?». Scegli la parola che completa l'analogia.",
  },
};

export function tasksByFactor(): Record<FactorCode, TaskDef[]> {
  const out = { Gf: [], Gwm: [], Gs: [], Gv: [], Gc: [] } as Record<
    FactorCode,
    TaskDef[]
  >;
  for (const code of TASK_ORDER) {
    const def = TASKS[code];
    out[def.factor].push(def);
  }
  return out;
}
