import { describe, expect, it } from "vitest";
import { evaluateQc } from "@/lib/scoring/qc";

describe("evaluateQc", () => {
  it("passa con trial normali e tutti gli 11 task completati", () => {
    const trials = Array.from({ length: 50 }, (_, i) => ({
      taskCode: i % 2 === 0 ? "matrix" : "vocabulary",
      rtMs: 2000,
      response: { chosenIndex: i % 4 },
      correct: i % 3 === 0,
    }));
    const r = evaluateQc(trials, 11);
    expect(r.passed).toBe(true);
    expect(r.flags).toEqual([]);
  });

  it("flagga RT impossibilmente bassi quando >30% sotto 200ms", () => {
    const trials = Array.from({ length: 20 }, (_, i) => ({
      taskCode: "matrix",
      rtMs: i < 8 ? 100 : 2000,
      response: { chosenIndex: i % 4 },
      correct: true,
    }));
    const r = evaluateQc(trials, 11);
    expect(r.flags).toContain("RT_IMPOSSIBLY_FAST");
  });

  it("RT impossibilmente bassi NON sono flaggati per task Gs (sono veloci per design)", () => {
    const trials = Array.from({ length: 20 }, (_, i) => ({
      taskCode: "symbol_match",
      rtMs: 150,
      response: { saysSame: true },
      correct: true,
    }));
    const r = evaluateQc(trials, 11);
    expect(r.flags).not.toContain("RT_IMPOSSIBLY_FAST");
  });

  it("flagga pattern uniforme quando >90% stesso option", () => {
    const trials = Array.from({ length: 20 }, () => ({
      taskCode: "matrix",
      rtMs: 2000,
      response: { chosenIndex: 0 },
      correct: false,
    }));
    const r = evaluateQc(trials, 11);
    expect(r.flags).toContain("UNIFORM_RESPONSE_PATTERN");
  });

  it("flagga task incompleti quando < 11", () => {
    const r = evaluateQc([], 5);
    expect(r.flags).toContain("INSUFFICIENT_TASK_COMPLETION");
    expect(r.passed).toBe(false);
  });

  it("flagga abandonment quando 0 task completati", () => {
    const r = evaluateQc([], 0);
    expect(r.flags).toContain("ABANDONMENT");
  });
});
