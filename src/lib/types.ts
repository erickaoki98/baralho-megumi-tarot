export type ReadingType = "1_carta" | "3_cartas" | "celta";
export type ReadingStatus = "aguardando" | "em_andamento" | "finalizada";
export type Arcano = "maior" | "menor";
export type Naipe = "copas" | "espadas" | "ouros" | "paus";

export const READING_CONFIG: Record<ReadingType, { numCartas: number }> = {
  "1_carta": { numCartas: 1 },
  "3_cartas": { numCartas: 3 },
  celta: { numCartas: 10 },
};

export interface Card {
  id: number;
  nome: string;
  nome_pt: string;
  arcano: Arcano;
  naipe: Naipe | null;
  numero: number | null;
  imagem_path: string;
}

export interface Reading {
  id: string;
  tipo: ReadingType;
  num_cartas: number;
  deck_order: number[];
  reverseds: boolean[];
  selected_positions: number[];
  status: ReadingStatus;
  created_at: string;
  finalized_at: string | null;
}

export interface ReadingPublic {
  id: string;
  tipo: ReadingType;
  num_cartas: number;
  status: ReadingStatus;
  total_cartas: number;
  revealed: RevealedCard[];
}

export interface RevealedCard {
  position: number;
  card: Card;
  reversed: boolean;
}
