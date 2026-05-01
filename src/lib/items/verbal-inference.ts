import { prisma } from "@/lib/db";
import { mulberry32 } from "./seed";

export type VerbalBankItem = {
  externalId: string;
  a: string;
  b: string;
  c: string;
  options: string[]; // 4, la prima e la corretta in DB
  relation: string;
  difficultyTier: 1 | 2 | 3;
  draft: boolean;
};

export type VerbalPresented = {
  externalId: string;
  a: string;
  b: string;
  c: string;
  options: string[];
  correctIndex: number;
  difficultyTier: 1 | 2 | 3;
  draft: boolean;
  relation: string;
};

export async function loadVerbalInferenceBank(): Promise<VerbalBankItem[]> {
  const rows = await prisma.itemBankEntry.findMany({
    where: { taskCode: "verbal_inference", active: true },
  });
  return rows.map((r) => {
    const c = r.content as {
      a: string;
      b: string;
      c: string;
      options: string[];
      relation: string;
      draft?: boolean;
    };
    return {
      externalId: r.externalId,
      a: c.a,
      b: c.b,
      c: c.c,
      options: c.options,
      relation: c.relation,
      difficultyTier: r.difficultyTier as 1 | 2 | 3,
      draft: c.draft ?? false,
    };
  });
}

export function selectVerbalItems(
  bank: VerbalBankItem[],
  rngSeed: string,
  count: number,
): VerbalPresented[] {
  let s = 0;
  for (let i = 0; i < rngSeed.length; i++) {
    s = (s * 31 + rngSeed.charCodeAt(i)) >>> 0;
  }
  const rng = mulberry32(s);

  const byTier: Record<1 | 2 | 3, VerbalBankItem[]> = { 1: [], 2: [], 3: [] };
  for (const item of bank) {
    byTier[item.difficultyTier].push(item);
  }

  const targetPerTier = Math.ceil(count / 3);
  const out: VerbalBankItem[] = [];
  for (const t of [1, 2, 3] as const) {
    const pool = [...byTier[t]];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j]!, pool[i]!];
    }
    out.push(...pool.slice(0, targetPerTier));
  }
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
    return {
      externalId: item.externalId,
      a: item.a,
      b: item.b,
      c: item.c,
      options: order.map((i) => item.options[i]!),
      correctIndex: order.indexOf(0),
      difficultyTier: item.difficultyTier,
      draft: item.draft,
      relation: item.relation,
    };
  });
}
