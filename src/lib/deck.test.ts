import { describe, it, expect } from "vitest";
import { shuffleDeck, revealCard } from "./deck";

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("shuffleDeck", () => {
  it("produces a permutation of 0-77 with no duplicates", () => {
    const { order } = shuffleDeck();
    expect(order).toHaveLength(78);
    const sorted = [...order].sort((a, b) => a - b);
    expect(sorted).toEqual(Array.from({ length: 78 }, (_, i) => i));
  });

  it("with a fixed seed produces the same result", () => {
    const a = shuffleDeck(mulberry32(42));
    const b = shuffleDeck(mulberry32(42));
    expect(a.order).toEqual(b.order);
  });
});

describe("revealCard", () => {
  const order = Array.from({ length: 78 }, (_, i) => i);

  it("returns correct cardId for valid position", () => {
    expect(revealCard(order, 5)).toEqual({ cardId: 5 });
    expect(revealCard(order, 0)).toEqual({ cardId: 0 });
  });

  it("throws for position < 0", () => {
    expect(() => revealCard(order, -1)).toThrow();
  });

  it("throws for position > 77", () => {
    expect(() => revealCard(order, 78)).toThrow();
  });

  it("throws for non-integer position", () => {
    expect(() => revealCard(order, 1.5)).toThrow();
  });
});
