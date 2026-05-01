import { FACTOR_CODES, type FactorCode } from "@/types/scoring";

/**
 * Template etziano per la narrazione per fattore. Selezione per fascia di
 * z-score (alto, medio, basso) + asimmetria opzionale.
 *
 * IMPORTANTE: questi template devono essere validati o riscritti da Davide
 * prima del lancio. La spec sezione 13.3 vincola Claude Code a fornire solo
 * prima draft per la copy etziana.
 */

type Band = "low" | "mid" | "high";

function bandFor(z: number): Band {
  if (z >= 0.5) return "high";
  if (z <= -0.5) return "low";
  return "mid";
}

const TEMPLATES: Record<FactorCode, Record<Band, string>> = {
  Gf: {
    high: "Il tuo ragionamento fluido si muove con agio in territori sconosciuti. Quando ti hanno presentato regole nuove, le hai trovate. Non subito sempre, raramente con fretta, ma con una qualità di ricerca che il sistema riconosce come distintiva.",
    mid: "Il tuo ragionamento fluido lavora con regolarità. Trovi le regole quando il materiale lo permette, e quando non le trovi, sai dove fermarti. Una solidità che fa il suo mestiere senza brillare e senza arrendersi.",
    low: "Il tuo ragionamento fluido procede con cautela quando le regole non sono date. È un modo, non un limite. Spesso chi si muove con prudenza nei territori astratti compensa con altre qualità che questa misura non vede.",
  },
  Gwm: {
    high: "La tua memoria di lavoro tiene molto, anche sotto pressione. Le sequenze di cifre, i blocchi che si illuminano, l'aggiornamento continuo: tutti hanno trovato spazio in te senza confondersi.",
    mid: "La tua memoria di lavoro lavora bene quando il materiale è ordinato e quando le richieste sono chiare. Sotto interferenza, qualcosa si lascia andare. Non è una mancanza: è una preferenza del tuo sistema per l'ampiezza piuttosto che per la frenesia.",
    low: "La tua memoria di lavoro fatica quando le informazioni si accumulano. Conta ricordare anche di sapere quando appoggiarsi a strumenti esterni: agende, liste, promemoria. Molte menti acute hanno scelto di esternalizzare la memoria proprio per liberare attenzione.",
  },
  Gs: {
    high: "La tua velocità di elaborazione è una cifra del tuo modo di stare nel cognitivo: rapida, decisa, precisa. Hai risposto in fretta senza perdere accuratezza.",
    mid: "La tua velocità di elaborazione si muove a una cadenza intermedia. Né lenta né scattante, una cifra adattiva utile in molti contesti.",
    low: "La tua velocità di elaborazione è misurata. Non è lentezza: è la cadenza di chi preferisce arrivare bene piuttosto che arrivare prima. In certi mestieri questa preferenza vale più di tutte le altre.",
  },
  Gv: {
    high: "Vedi lontano nello spazio mentale. Ruoti oggetti tridimensionali, immagini fogli che si piegano, e arrivi alle conclusioni senza dover mai uscire dalla tua testa. Una qualità preziosa, e relativamente rara nella popolazione.",
    mid: "La tua elaborazione visuospaziale lavora con continuità. Quando l'oggetto è chiaro lo segui bene. Quando è complesso ti prendi il tempo che serve.",
    low: "L'elaborazione visuospaziale richiede sforzo nel tuo profilo. È normale: molte persone con grande competenza verbale o analitica trovano faticosa la rotazione mentale di figure 3D. Chi mostra questo pattern spesso compensa con strategie verbali o annotative.",
  },
  Gc: {
    high: "La tua conoscenza cristallizzata è ampia. Il vocabolario tiene, le inferenze verbali si compongono. È il segno di una storia di letture e di curiosità che si è depositata e che continua a essere disponibile.",
    mid: "La tua conoscenza cristallizzata è solida. Quando l'oggetto verbale è familiare, lo riconosci. Quando è raro, ti orienti per analogia. Una base equilibrata su cui appoggiare apprendimenti futuri.",
    low: "La tua conoscenza cristallizzata in questo momento mostra un range più contenuto. Questa misura risente molto degli anni di esposizione e di lettura: non è un indicatore di intelligenza, è un indicatore di archivio. Gli archivi si possono ampliare in qualsiasi momento.",
  },
};

export type FactorNarrative = {
  factor: FactorCode;
  band: Band;
  text: string;
};

export function generateFactorNarrative(
  factor: FactorCode,
  zScore: number,
): FactorNarrative {
  const band = bandFor(zScore);
  return { factor, band, text: TEMPLATES[factor][band] };
}

export function generateAllNarratives(
  factorZScores: Record<FactorCode, number>,
): FactorNarrative[] {
  return FACTOR_CODES.map((f) => generateFactorNarrative(f, factorZScores[f]));
}

/**
 * Apertura etziana standard, presenta il modello CHC e ricorda che il
 * profilo e un ritratto, non un giudizio.
 */
export function openingNarrative(): string {
  return "Quello che vedi qui è un ritratto. Cinque dimensioni per cinque modi di abitare la propria mente. Nessuna gerarchia, nessuna soglia. Solo la geografia del tuo pensiero, oggi.";
}

/**
 * Chiusura: lettura integrata della forma del profilo, individuazione di
 * eventuali asimmetrie produttive.
 */
export function closingNarrative(
  factorZScores: Record<FactorCode, number>,
): string {
  const values = FACTOR_CODES.map((f) => factorZScores[f]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  if (range < 0.5) {
    return "La forma del tuo profilo è regolare. Non ci sono picchi netti né valli profonde. Una geografia equilibrata, dove ogni dimensione fa la sua parte. È una solidità, non una mancanza di carattere cognitivo.";
  }
  if (range > 1.5) {
    return "La forma del tuo profilo è marcatamente asimmetrica, e l'asimmetria è interessante. Esistono dimensioni in cui il tuo pensiero si muove con più agio di altre. Questa diversità interna è quasi sempre una risorsa quando viene riconosciuta.";
  }
  return "La forma del tuo profilo mostra delle asimmetrie misurabili tra le dimensioni. È normale, e spesso utile sapere dove si appoggia il proprio pensiero più volentieri.";
}
