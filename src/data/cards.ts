import type { Card, Naipe } from "@/lib/types";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const MAJOR_ARCANA: [string, string][] = [
  ["The Fool", "O Louco"],
  ["The Magician", "O Mago"],
  ["The High Priestess", "A Sacerdotisa"],
  ["The Empress", "A Imperatriz"],
  ["The Emperor", "O Imperador"],
  ["The Hierophant", "O Hierofante"],
  ["The Lovers", "Os Amantes"],
  ["The Chariot", "O Carro"],
  ["Strength", "A Força"],
  ["The Hermit", "O Eremita"],
  ["Wheel of Fortune", "A Roda da Fortuna"],
  ["Justice", "A Justiça"],
  ["The Hanged Man", "O Pendurado"],
  ["Death", "A Morte"],
  ["Temperance", "A Temperança"],
  ["The Devil", "O Diabo"],
  ["The Tower", "A Torre"],
  ["The Star", "A Estrela"],
  ["The Moon", "A Lua"],
  ["The Sun", "O Sol"],
  ["Judgement", "O Julgamento"],
  ["The World", "O Mundo"],
];

const SUITS: { en: string; pt: string; naipe: Naipe }[] = [
  { en: "Cups", pt: "Copas", naipe: "copas" },
  { en: "Swords", pt: "Espadas", naipe: "espadas" },
  { en: "Pentacles", pt: "Ouros", naipe: "ouros" },
  { en: "Wands", pt: "Paus", naipe: "paus" },
];

const RANKS: [string, string, number][] = [
  ["Ace", "Ás", 1],
  ["Two", "Dois", 2],
  ["Three", "Três", 3],
  ["Four", "Quatro", 4],
  ["Five", "Cinco", 5],
  ["Six", "Seis", 6],
  ["Seven", "Sete", 7],
  ["Eight", "Oito", 8],
  ["Nine", "Nove", 9],
  ["Ten", "Dez", 10],
  ["Page", "Pajem", 11],
  ["Knight", "Cavaleiro", 12],
  ["Queen", "Rainha", 13],
  ["King", "Rei", 14],
];

export const CARDS: Card[] = [
  ...MAJOR_ARCANA.map(
    ([nome, nome_pt], i): Card => ({
      id: i,
      nome,
      nome_pt,
      arcano: "maior",
      naipe: null,
      numero: i,
      imagem_path: `cards/${String(i).padStart(2, "0")}-${slugify(nome)}.jpg`,
    }),
  ),
  ...SUITS.flatMap((suit, suitIdx) =>
    RANKS.map(([rank, rank_pt, num], rankIdx): Card => {
      const id = 22 + suitIdx * 14 + rankIdx;
      return {
        id,
        nome: `${rank} of ${suit.en}`,
        nome_pt: `${rank_pt} de ${suit.pt}`,
        arcano: "menor",
        naipe: suit.naipe,
        numero: num,
        imagem_path: `cards/${String(id).padStart(2, "0")}-${slugify(`${rank}-of-${suit.en}`)}.jpg`,
      };
    }),
  ),
];
