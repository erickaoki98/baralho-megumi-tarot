import type { Reading } from "@/lib/types";

type ValidationResult = { ok: true } | { ok: false; error: string };

export function canReveal(
  reading: Reading,
  position: number,
): ValidationResult {
  if (!Number.isInteger(position) || position < 0 || position > 77) {
    return { ok: false, error: `Invalid position: ${position}` };
  }
  if (reading.status === "finalizada") {
    return { ok: false, error: "Reading already finalized" };
  }
  const isIdempotent = reading.selected_positions.includes(position);
  if (!isIdempotent && reading.selected_positions.length >= reading.num_cartas) {
    return { ok: false, error: "Maximum cards already revealed" };
  }
  return { ok: true };
}

export function canFinalize(reading: Reading): ValidationResult {
  if (reading.status === "finalizada") {
    return { ok: false, error: "Already finalized" };
  }
  if (reading.selected_positions.length !== reading.num_cartas) {
    return {
      ok: false,
      error: `Need ${reading.num_cartas} cards, have ${reading.selected_positions.length}`,
    };
  }
  return { ok: true };
}
