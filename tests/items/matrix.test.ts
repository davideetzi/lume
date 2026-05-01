import { describe, expect, it } from "vitest";
import {
  ALL_RULES,
  difficultyForTrial,
  generateMatrix,
} from "@/lib/items/matrix";

describe("generateMatrix", () => {
  it("genera griglia 3x3", () => {
    const item = generateMatrix({ seed: "test-1", difficulty: 1 });
    expect(item.grid.length).toBe(3);
    item.grid.forEach((row) => expect(row.length).toBe(3));
  });

  it("genera 4 opzioni con esattamente una corretta", () => {
    const item = generateMatrix({ seed: "test-2", difficulty: 2 });
    expect(item.options.length).toBe(4);
    const correct = item.options[item.correctIndex];
    const target = item.grid[2]![2]!;
    expect(correct).toEqual(target);
  });

  it("opzioni sono tutte distinte", () => {
    const item = generateMatrix({ seed: "test-3", difficulty: 3 });
    const keys = item.options.map(
      (c) => `${c.shape}|${c.color}|${c.count}|${c.rotation}`,
    );
    expect(new Set(keys).size).toBe(4);
  });

  it("seed identico produce item identico", () => {
    const a = generateMatrix({ seed: "same", difficulty: 2 });
    const b = generateMatrix({ seed: "same", difficulty: 2 });
    expect(a).toEqual(b);
  });

  it("seed diverse producono item diversi", () => {
    const a = generateMatrix({ seed: "alpha", difficulty: 2 });
    const b = generateMatrix({ seed: "beta", difficulty: 2 });
    expect(a.grid).not.toEqual(b.grid);
  });

  it("difficolta corrisponde al numero di regole attive", () => {
    for (const d of [1, 2, 3] as const) {
      const item = generateMatrix({ seed: `d-${d}`, difficulty: d });
      expect(item.rules.length).toBe(d);
      item.rules.forEach((r) => expect(ALL_RULES).toContain(r));
    }
  });

  it("tutte le 4 opzioni hanno parametri validi", () => {
    const item = generateMatrix({ seed: "valid", difficulty: 3 });
    item.options.forEach((c) => {
      expect([1, 2, 3]).toContain(c.count);
      expect([0, 90, 180, 270]).toContain(c.rotation);
    });
  });
});

describe("difficultyForTrial", () => {
  it("salita progressiva nel blocco di 20 trial", () => {
    expect(difficultyForTrial(0)).toBe(1);
    expect(difficultyForTrial(6)).toBe(1);
    expect(difficultyForTrial(7)).toBe(2);
    expect(difficultyForTrial(13)).toBe(2);
    expect(difficultyForTrial(14)).toBe(3);
    expect(difficultyForTrial(19)).toBe(3);
  });
});
