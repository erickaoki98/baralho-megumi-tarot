import { getServiceClient } from "@/lib/supabase";
import { shuffleDeck, revealCard } from "@/lib/deck";
import { canReveal, canFinalize } from "./validation";
import { CARDS } from "@/data/cards";
import { READING_CONFIG } from "@/lib/types";
import type {
  Reading,
  ReadingType,
  ReadingPublic,
  RevealedCard,
} from "@/lib/types";

function buildRevealedCards(reading: Reading): RevealedCard[] {
  return reading.selected_positions.map((pos) => {
    const { cardId, reversed } = revealCard(
      reading.deck_order,
      reading.reverseds,
      pos,
    );
    const card = CARDS.find((c) => c.id === cardId)!;
    return { position: pos, card, reversed };
  });
}

export async function createReading(tipo: ReadingType): Promise<ReadingPublic> {
  const config = READING_CONFIG[tipo];
  const { order, reverseds } = shuffleDeck();
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("readings")
    .insert({
      tipo,
      num_cartas: config.numCartas,
      deck_order: order,
      reverseds,
    })
    .select("id, tipo, num_cartas, status")
    .single();

  if (error) throw new Error(`Failed to create reading: ${error.message}`);

  return {
    id: data.id,
    tipo: data.tipo,
    num_cartas: data.num_cartas,
    status: data.status,
    total_cartas: 78,
    revealed: [],
  };
}

export async function getReadingPublic(
  id: string,
): Promise<ReadingPublic | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("readings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;

  const reading = data as Reading;
  return {
    id: reading.id,
    tipo: reading.tipo,
    num_cartas: reading.num_cartas,
    status: reading.status,
    total_cartas: 78,
    revealed: buildRevealedCards(reading),
  };
}

export async function revealPosition(
  id: string,
  position: number,
): Promise<RevealedCard> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("readings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new Error("Reading not found");

  const reading = data as Reading;
  const check = canReveal(reading, position);
  if (!check.ok) throw new Error(check.error);

  const isIdempotent = reading.selected_positions.includes(position);

  if (!isIdempotent) {
    const newStatus =
      reading.status === "aguardando" ? "em_andamento" : reading.status;
    const { error: updateError } = await supabase
      .from("readings")
      .update({
        selected_positions: [...reading.selected_positions, position],
        status: newStatus,
      })
      .eq("id", id);

    if (updateError)
      throw new Error(`Failed to reveal: ${updateError.message}`);
  }

  const { cardId, reversed } = revealCard(
    reading.deck_order,
    reading.reverseds,
    position,
  );
  const card = CARDS.find((c) => c.id === cardId)!;
  return { position, card, reversed };
}

export async function finalizeReading(id: string): Promise<RevealedCard[]> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("readings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new Error("Reading not found");

  const reading = data as Reading;
  const check = canFinalize(reading);
  if (!check.ok) throw new Error(check.error);

  const { error: updateError } = await supabase
    .from("readings")
    .update({
      status: "finalizada",
      finalized_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError)
    throw new Error(`Failed to finalize: ${updateError.message}`);

  return buildRevealedCards(reading);
}
