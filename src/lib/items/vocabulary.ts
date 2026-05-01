import { prisma } from "@/lib/db";
import { mulberry32 } from "./seed";

export type VocabBankItem = {
  id: string;
  externalId: string;
  word: string;
  options: string[]; // 4, la prima e sempre la corretta in DB
  difficultyTier: 1 | 2 | 3;
  draft: boolean;
};

export type VocabPresented = {
  externalId: string;
  word: string;
  options: string[]; // shuffled
  correctIndex: number;
  difficultyTier: 1 | 2 | 3;
  draft: boolean;
};

export async function loadVocabularyBank(): Promise<VocabBankItem[]> {
  const rows = await prisma.itemBankEntry.findMany({
    where: { taskCode: "vocabulary", active: true },
  });
  return rows.map((r) => {
    const c = r.content as {
      word: string;
      options: string[];
      draft?: boolean;
    };
    return {
      id: r.id,
      externalId: r.externalId,
      word: c.word,
      options: c.options,
      difficultyTier: r.difficultyTier as 1 | 2 | 3,
      draft: c.draft ?? false,
    };
  });
}

/**
 * Seleziona N item dal bank stratificando per difficolta. Per ogni item
 * mescola le 4 opzioni (la prima e la corretta in DB).
 */
export function selectVocabItems(
  bank: VocabBankItem[],
  rngSeed: string,
  count: number,
): VocabPresented[] {
  let s = 0;
  for (let i = 0; i < rngSeed.length; i++) {
    s = (s * 31 + rngSeed.charCodeAt(i)) >>> 0;
  }
  const rng = mulberry32(s);

  // stratifica per tier: ~33% per tier
  const byTier: Record<1 | 2 | 3, VocabBankItem[]> = { 1: [], 2: [], 3: [] };
  for (const item of bank) {
    byTier[item.difficultyTier].push(item);
  }

  const targetPerTier = Math.ceil(count / 3);
  const out: VocabBankItem[] = [];
  for (const t of [1, 2, 3] as const) {
    const pool = [...byTier[t]];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j]!, pool[i]!];
    }
    out.push(...pool.slice(0, targetPerTier));
  }
  // shuffle finale e tronca a count
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  const trimmed = out.slice(0, count);

  return trimmed.map((item) => {
    const order = [0, 1, 2, 3];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    const opts = order.map((i) => item.options[i]!);
    const correctIndex = order.indexOf(0);
    return {
      externalId: item.externalId,
      word: item.word,
      options: opts,
      correctIndex,
      difficultyTier: item.difficultyTier,
      draft: item.draft,
    };
  });
}
