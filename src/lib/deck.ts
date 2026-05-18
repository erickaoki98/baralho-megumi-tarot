import { randomBytes } from "crypto";

function cryptoRng(): number {
  const buf = randomBytes(4);
  return buf.readUInt32BE(0) / 4294967296;
}

export function shuffleDeck(
  rng: () => number = cryptoRng,
  reversalProbability = 0.3,
): { order: number[]; reverseds: boolean[] } {
  const order = Array.from({ length: 78 }, (_, i) => i);

  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const reverseds = Array.from(
    { length: 78 },
    () => rng() < reversalProbability,
  );

  return { order, reverseds };
}

export function revealCard(
  deckOrder: number[],
  reverseds: boolean[],
  position: number,
): { cardId: number; reversed: boolean } {
  if (!Number.isInteger(position) || position < 0 || position > 77) {
    throw new Error(`Invalid position: ${position}. Must be integer 0-77.`);
  }
  return {
    cardId: deckOrder[position],
    reversed: reverseds[position],
  };
}
