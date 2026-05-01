import { describe, expect, it } from "vitest";
import {
  applyAttempt,
  generateDigitSequence,
  initialState,
  reverseSequence,
} from "@/lib/items/digit-span";

describe("generateDigitSequence", () => {
  it("genera N cifre valide", () => {
    const s = generateDigitSequence("seed-1", 5);
    expect(s).toHaveLength(5);
    s.forEach((d) => {
      expect(Number.isInteger(d)).toBe(true);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThan(10);
    });
  });

  it("nessuna cifra ripetuta consecutivamente", () => {
    for (let i = 0; i < 50; i++) {
      const s = generateDigitSequence(`seed-${i}`, 9);
      for (let j = 1; j < s.length; j++) {
        expect(s[j]).not.toBe(s[j - 1]);
      }
    }
  });

  it("seed identica = sequenza identica", () => {
    expect(generateDigitSequence("same", 6)).toEqual(
      generateDigitSequence("same", 6),
    );
  });
});

describe("reverseSequence", () => {
  it("inverte e non muta l'input", () => {
    const a = [1, 2, 3, 4];
    const r = reverseSequence(a);
    expect(r).toEqual([4, 3, 2, 1]);
    expect(a).toEqual([1, 2, 3, 4]);
  });
});

describe("digit-span state machine", () => {
  it("2 successi consecutivi al livello -> sale", () => {
    let s = initialState(3);
    s = applyAttempt(s, true);
    expect(s.level).toBe(3);
    s = applyAttempt(s, true);
    expect(s.level).toBe(4);
    expect(s.maxLevelReached).toBe(3);
  });

  it("2 fallimenti totali al livello -> stop", () => {
    let s = initialState(3);
    s = applyAttempt(s, false);
    expect(s.done).toBe(false);
    s = applyAttempt(s, false);
    expect(s.done).toBe(true);
  });

  it("alternanza fallimento-successo non chiude la sessione subito ma il 2o fail si", () => {
    let s = initialState(3);
    s = applyAttempt(s, false);
    s = applyAttempt(s, true);
    expect(s.done).toBe(false);
    s = applyAttempt(s, false);
    expect(s.done).toBe(true);
  });

  it("max livello = 9, dopo 2 successi a 9 chiude come done", () => {
    let s = initialState(9);
    s = applyAttempt(s, true);
    s = applyAttempt(s, true);
    expect(s.done).toBe(true);
    expect(s.maxLevelReached).toBe(9);
  });

  it("traccia totalCorrect e totalAttempts", () => {
    let s = initialState(3);
    s = applyAttempt(s, true);
    s = applyAttempt(s, false);
    s = applyAttempt(s, true);
    expect(s.totalAttempts).toBe(3);
    expect(s.totalCorrect).toBe(2);
  });
});
