import { describe, it, expect } from "vitest";
import { canReveal, canFinalize } from "./validation";
import type { Reading } from "@/lib/types";

const baseReading: Reading = {
  id: "test-uuid",
  tipo: "3_cartas",
  num_cartas: 3,
  deck_order: Array.from({ length: 78 }, (_, i) => i),

  selected_positions: [],
  status: "aguardando",
  created_at: new Date().toISOString(),
  finalized_at: null,
};

describe("canReveal", () => {
  it("allows reveal on aguardando status", () => {
    expect(canReveal(baseReading, 0)).toEqual({ ok: true });
  });

  it("allows reveal on em_andamento status", () => {
    const r: Reading = {
      ...baseReading,
      status: "em_andamento",
      selected_positions: [10],
    };
    expect(canReveal(r, 5)).toEqual({ ok: true });
  });

  it("rejects reveal on finalizada", () => {
    const r: Reading = { ...baseReading, status: "finalizada" };
    const result = canReveal(r, 0);
    expect(result.ok).toBe(false);
  });

  it("rejects invalid position (>77)", () => {
    expect(canReveal(baseReading, 78).ok).toBe(false);
  });

  it("rejects invalid position (<0)", () => {
    expect(canReveal(baseReading, -1).ok).toBe(false);
  });

  it("allows idempotent reveal (already selected)", () => {
    const r: Reading = { ...baseReading, selected_positions: [5] };
    expect(canReveal(r, 5)).toEqual({ ok: true });
  });

  it("rejects reveal when num_cartas already reached and position is new", () => {
    const r: Reading = { ...baseReading, selected_positions: [1, 2, 3] };
    expect(canReveal(r, 10).ok).toBe(false);
  });
});

describe("canFinalize", () => {
  it("allows finalize when exactly num_cartas revealed", () => {
    const r: Reading = {
      ...baseReading,
      status: "em_andamento",
      selected_positions: [1, 2, 3],
    };
    expect(canFinalize(r)).toEqual({ ok: true });
  });

  it("rejects finalize when fewer than num_cartas revealed", () => {
    const r: Reading = { ...baseReading, selected_positions: [1, 2] };
    expect(canFinalize(r).ok).toBe(false);
  });

  it("rejects finalize on already finalizada", () => {
    const r: Reading = {
      ...baseReading,
      status: "finalizada",
      selected_positions: [1, 2, 3],
    };
    expect(canFinalize(r).ok).toBe(false);
  });
});
