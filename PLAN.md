# Baralho Megumitarot — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap do sistema de tiragem de tarô online — mecânica de embaralhar no servidor e revelar cartas por consulta. Deploy futuro em `baralho.megumitarot.com.br`.

**Architecture:** Next.js 16 (App Router) com API routes que encapsulam toda lógica server-side. Supabase Postgres como banco — `deck_order` armazenado no servidor, nunca exposto ao cliente. Camada de lógica pura (`deck.ts`) separada do serviço de readings (DB). UI mínima funcional para validação manual.

**Tech Stack:** Next.js 16, TypeScript strict, Tailwind CSS 4, Supabase JS v2, Zod 4, Vitest, Playwright

**Nota:** `create-next-app@latest` gerou Next.js 16 (não 15). A API é compatível; params em API routes são `Promise` (await obrigatório).

---

## File Structure

```
baralho-megumitarot/
├── PLAN.md
├── .env.example
├── vitest.config.ts
├── playwright.config.ts
├── package.json                      # scripts: test, e2e, seed
├── supabase/
│   └── migrations/
│       └── 0001_init.sql
├── scripts/
│   └── seed-cards.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # landing
│   │   ├── globals.css
│   │   ├── reading/[id]/
│   │   │   ├── page.tsx              # server: fetch + render Board
│   │   │   ├── board.tsx             # client component: 78 grid + reveal
│   │   │   └── result/
│   │   │       └── page.tsx          # resultado final
│   │   └── api/v1/readings/
│   │       ├── route.ts              # POST — criar reading
│   │       └── [id]/
│   │           ├── route.ts          # GET — metadados públicos
│   │           ├── reveal/
│   │           │   └── route.ts      # POST — revelar posição
│   │           └── finalize/
│   │               └── route.ts      # POST — finalizar
│   ├── lib/
│   │   ├── deck.ts                   # shuffleDeck, revealCard (puro)
│   │   ├── deck.test.ts
│   │   ├── supabase.ts              # service role client
│   │   ├── readings/
│   │   │   ├── service.ts           # CRUD + lógica de negócio
│   │   │   └── validation.ts        # canReveal, canFinalize (puro)
│   │   │   └── validation.test.ts
│   │   └── types.ts
│   └── data/
│       └── cards.ts                  # 78 cartas Rider-Waite
└── tests/
    └── e2e/
        └── reading-flow.spec.ts
```

---

### Task 1: Project Configuration

**Files:**
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `.env.example`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Create vitest.config.ts**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 2: Create playwright.config.ts**

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:3000",
  },
});
```

- [ ] **Step 3: Create .env.example**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- [ ] **Step 4: Add scripts to package.json**

Add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:ui": "vitest --ui",
"e2e": "playwright test",
"seed": "tsx scripts/seed-cards.ts"
```

- [ ] **Step 5: Install tsx for seed script**

```bash
pnpm add -D tsx
```

- [ ] **Step 6: Verify vitest runs (no tests yet, should exit clean)**

```bash
pnpm test
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: configure vitest, playwright, env, scripts"
```

---

### Task 2: Supabase Migration

**Files:**
- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Sem RLS por enquanto. TODO: habilitar quando autenticação for implementada.
-- Para aplicar: rode via Supabase CLI (supabase db push) ou cole no SQL Editor do dashboard.

create table cards (
  id int primary key,                  -- 0 a 77
  nome text not null,
  nome_pt text not null,
  arcano text not null check (arcano in ('maior', 'menor')),
  naipe text check (naipe in ('copas', 'espadas', 'ouros', 'paus')),
  numero int,
  imagem_path text not null
);

create table readings (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('1_carta', '3_cartas', 'celta')),
  num_cartas int not null,
  deck_order int[] not null,           -- ordem embaralhada das 78, FONTE DA VERDADE
  reverseds bool[] not null,           -- se cada posição sai invertida
  selected_positions int[] not null default '{}',
  status text not null default 'aguardando'
    check (status in ('aguardando', 'em_andamento', 'finalizada')),
  created_at timestamptz not null default now(),
  finalized_at timestamptz,
  constraint deck_order_complete check (array_length(deck_order, 1) = 78),
  constraint reverseds_complete check (array_length(reverseds, 1) = 78)
);

create index on readings (status, created_at desc);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/
git commit -m "chore: add initial Supabase migration (cards + readings)"
```

---

### Task 3: Type Definitions

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Create types**

```typescript
// src/lib/types.ts

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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add core type definitions"
```

---

### Task 4: Deck Logic — TDD

**Files:**
- Create: `src/lib/deck.test.ts`
- Create: `src/lib/deck.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/deck.test.ts
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
    const { order, reverseds } = shuffleDeck();
    expect(order).toHaveLength(78);
    expect(reverseds).toHaveLength(78);
    const sorted = [...order].sort((a, b) => a - b);
    expect(sorted).toEqual(Array.from({ length: 78 }, (_, i) => i));
  });

  it("with a fixed seed produces the same result", () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    const a = shuffleDeck(rng1);
    const b = shuffleDeck(rng2);
    expect(a.order).toEqual(b.order);
    expect(a.reverseds).toEqual(b.reverseds);
  });

  it("respects custom reversal probability", () => {
    const rng = mulberry32(123);
    const { reverseds } = shuffleDeck(rng, 0);
    expect(reverseds.every((r) => r === false)).toBe(true);

    const rng2 = mulberry32(456);
    const { reverseds: rev2 } = shuffleDeck(rng2, 1);
    expect(rev2.every((r) => r === true)).toBe(true);
  });
});

describe("revealCard", () => {
  const order = Array.from({ length: 78 }, (_, i) => i);
  const reverseds = Array.from({ length: 78 }, (_, i) => i % 2 === 0);

  it("returns correct card and reversed status for valid position", () => {
    const result = revealCard(order, reverseds, 5);
    expect(result).toEqual({ cardId: 5, reversed: false });

    const result2 = revealCard(order, reverseds, 0);
    expect(result2).toEqual({ cardId: 0, reversed: true });
  });

  it("throws for position < 0", () => {
    expect(() => revealCard(order, reverseds, -1)).toThrow();
  });

  it("throws for position > 77", () => {
    expect(() => revealCard(order, reverseds, 78)).toThrow();
  });

  it("throws for non-integer position", () => {
    expect(() => revealCard(order, reverseds, 1.5)).toThrow();
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pnpm test
```
Expected: FAIL — `deck.ts` doesn't exist yet.

- [ ] **Step 3: Implement deck.ts**

```typescript
// src/lib/deck.ts
import { randomBytes } from "crypto";

function cryptoRng(): number {
  const buf = randomBytes(4);
  return buf.readUInt32BE(0) / 4294967296;
}

export function shuffleDeck(
  rng: () => number = cryptoRng,
  reversalProbability = 0.3
): { order: number[]; reverseds: boolean[] } {
  const order = Array.from({ length: 78 }, (_, i) => i);

  // Fisher-Yates
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const reverseds = Array.from({ length: 78 }, () => rng() < reversalProbability);

  return { order, reverseds };
}

export function revealCard(
  deckOrder: number[],
  reverseds: boolean[],
  position: number
): { cardId: number; reversed: boolean } {
  if (!Number.isInteger(position) || position < 0 || position > 77) {
    throw new Error(`Invalid position: ${position}. Must be integer 0-77.`);
  }
  return {
    cardId: deckOrder[position],
    reversed: reverseds[position],
  };
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pnpm test
```
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/deck.ts src/lib/deck.test.ts
git commit -m "feat: deck logic (shuffle + reveal) with TDD"
```

---

### Task 5: Supabase Client

**Files:**
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Create service role client**

```typescript
// src/lib/supabase.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    client = createClient(url, key);
  }
  return client;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "feat: Supabase service role client"
```

---

### Task 6: Card Data (78 cartas Rider-Waite)

**Files:**
- Create: `src/data/cards.ts`

- [ ] **Step 1: Create card data with generation logic**

```typescript
// src/data/cards.ts
import type { Card, Naipe } from "@/lib/types";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
  ...MAJOR_ARCANA.map(([nome, nome_pt], i): Card => ({
    id: i,
    nome,
    nome_pt,
    arcano: "maior",
    naipe: null,
    numero: i,
    imagem_path: `cards/${String(i).padStart(2, "0")}-${slugify(nome)}.jpg`,
  })),
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
    })
  ),
];
```

- [ ] **Step 2: Commit**

```bash
git add src/data/cards.ts
git commit -m "feat: 78 Rider-Waite card definitions"
```

---

### Task 7: Readings Validation (TDD) + Service

**Files:**
- Create: `src/lib/readings/validation.ts`
- Create: `src/lib/readings/validation.test.ts`
- Create: `src/lib/readings/service.ts`

- [ ] **Step 1: Write failing validation tests**

```typescript
// src/lib/readings/validation.test.ts
import { describe, it, expect } from "vitest";
import { canReveal, canFinalize } from "./validation";
import type { Reading } from "@/lib/types";

const baseReading: Reading = {
  id: "test-uuid",
  tipo: "3_cartas",
  num_cartas: 3,
  deck_order: Array.from({ length: 78 }, (_, i) => i),
  reverseds: Array.from({ length: 78 }, () => false),
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
    const r = { ...baseReading, status: "em_andamento" as const, selected_positions: [10] };
    expect(canReveal(r, 5)).toEqual({ ok: true });
  });

  it("rejects reveal on finalizada", () => {
    const r = { ...baseReading, status: "finalizada" as const };
    const result = canReveal(r, 0);
    expect(result.ok).toBe(false);
  });

  it("rejects invalid position", () => {
    const result = canReveal(baseReading, 78);
    expect(result.ok).toBe(false);
  });

  it("allows idempotent reveal (already selected position)", () => {
    const r = { ...baseReading, selected_positions: [5] };
    expect(canReveal(r, 5)).toEqual({ ok: true });
  });

  it("rejects reveal when num_cartas already reached and position is new", () => {
    const r = { ...baseReading, selected_positions: [1, 2, 3] };
    const result = canReveal(r, 10);
    expect(result.ok).toBe(false);
  });
});

describe("canFinalize", () => {
  it("allows finalize when exactly num_cartas revealed", () => {
    const r = { ...baseReading, status: "em_andamento" as const, selected_positions: [1, 2, 3] };
    expect(canFinalize(r)).toEqual({ ok: true });
  });

  it("rejects finalize when fewer than num_cartas revealed", () => {
    const r = { ...baseReading, selected_positions: [1, 2] };
    const result = canFinalize(r);
    expect(result.ok).toBe(false);
  });

  it("rejects finalize on already finalizada", () => {
    const r = { ...baseReading, status: "finalizada" as const, selected_positions: [1, 2, 3] };
    const result = canFinalize(r);
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pnpm test
```

- [ ] **Step 3: Implement validation.ts**

```typescript
// src/lib/readings/validation.ts
import type { Reading } from "@/lib/types";

type ValidationResult = { ok: true } | { ok: false; error: string };

export function canReveal(reading: Reading, position: number): ValidationResult {
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pnpm test
```

- [ ] **Step 5: Implement readings service**

```typescript
// src/lib/readings/service.ts
import { getServiceClient } from "@/lib/supabase";
import { shuffleDeck, revealCard } from "@/lib/deck";
import { canReveal, canFinalize } from "./validation";
import { CARDS } from "@/data/cards";
import { READING_CONFIG } from "@/lib/types";
import type { Reading, ReadingType, ReadingPublic, RevealedCard } from "@/lib/types";

function buildRevealedCards(reading: Reading): RevealedCard[] {
  return reading.selected_positions.map((pos) => {
    const { cardId, reversed } = revealCard(reading.deck_order, reading.reverseds, pos);
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

export async function getReadingPublic(id: string): Promise<ReadingPublic | null> {
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
  position: number
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
    const newStatus = reading.status === "aguardando" ? "em_andamento" : reading.status;
    const { error: updateError } = await supabase
      .from("readings")
      .update({
        selected_positions: [...reading.selected_positions, position],
        status: newStatus,
      })
      .eq("id", id);

    if (updateError) throw new Error(`Failed to reveal: ${updateError.message}`);
  }

  const { cardId, reversed } = revealCard(reading.deck_order, reading.reverseds, position);
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

  if (updateError) throw new Error(`Failed to finalize: ${updateError.message}`);

  return buildRevealedCards(reading);
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/readings/
git commit -m "feat: readings validation (TDD) + service layer"
```

---

### Task 8: Zod Schemas + API Routes

**Files:**
- Create: `src/app/api/v1/readings/route.ts`
- Create: `src/app/api/v1/readings/[id]/route.ts`
- Create: `src/app/api/v1/readings/[id]/reveal/route.ts`
- Create: `src/app/api/v1/readings/[id]/finalize/route.ts`

- [ ] **Step 1: POST /api/v1/readings**

```typescript
// src/app/api/v1/readings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createReading } from "@/lib/readings/service";

const CreateReadingSchema = z.object({
  tipo: z.enum(["1_carta", "3_cartas", "celta"]),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = CreateReadingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  try {
    const reading = await createReading(parsed.data.tipo);
    return NextResponse.json(reading, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: GET /api/v1/readings/[id]**

```typescript
// src/app/api/v1/readings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getReadingPublic } from "@/lib/readings/service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const reading = await getReadingPublic(id);
  if (!reading) {
    return NextResponse.json({ error: "Reading not found" }, { status: 404 });
  }

  return NextResponse.json(reading);
}
```

- [ ] **Step 3: POST /api/v1/readings/[id]/reveal**

```typescript
// src/app/api/v1/readings/[id]/reveal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revealPosition } from "@/lib/readings/service";

const RevealSchema = z.object({
  position: z.number().int().min(0).max(77),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = RevealSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  try {
    const result = await revealPosition(id, parsed.data.position);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
```

- [ ] **Step 4: POST /api/v1/readings/[id]/finalize**

```typescript
// src/app/api/v1/readings/[id]/finalize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { finalizeReading } from "@/lib/readings/service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const cards = await finalizeReading(id);
    return NextResponse.json({ id, status: "finalizada", cards });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/
git commit -m "feat: API routes (create, get, reveal, finalize)"
```

---

### Task 9: Seed Script

**Files:**
- Create: `scripts/seed-cards.ts`

- [ ] **Step 1: Create seed script**

```typescript
// scripts/seed-cards.ts
import { createClient } from "@supabase/supabase-js";
import { CARDS } from "../src/data/cards";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  console.log(`Seeding ${CARDS.length} cards...`);

  const { error } = await supabase.from("cards").upsert(CARDS, { onConflict: "id" });

  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }

  console.log("Done! 78 cards seeded.");
}

main();
```

- [ ] **Step 2: Commit**

```bash
git add scripts/
git commit -m "feat: seed script for 78 Rider-Waite cards"
```

---

### Task 10: UI — Landing Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace landing page**

```tsx
// src/app/page.tsx
import { redirect } from "next/navigation";
import { createReading } from "@/lib/readings/service";
import type { ReadingType } from "@/lib/types";

export default function Home() {
  async function novaLeitura(formData: FormData) {
    "use server";
    const tipo = formData.get("tipo") as ReadingType;
    const reading = await createReading(tipo);
    redirect(`/reading/${reading.id}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-3xl font-bold">Baralho — Megumi Tarot</h1>
      <p className="text-gray-600">Escolha o tipo de tiragem:</p>
      <div className="flex gap-4">
        <form action={novaLeitura}>
          <input type="hidden" name="tipo" value="1_carta" />
          <button
            type="submit"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            1 Carta
          </button>
        </form>
        <form action={novaLeitura}>
          <input type="hidden" name="tipo" value="3_cartas" />
          <button
            type="submit"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            3 Cartas
          </button>
        </form>
        <form action={novaLeitura}>
          <input type="hidden" name="tipo" value="celta" />
          <button
            type="submit"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Cruz Celta (10)
          </button>
        </form>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: landing page with reading type selection"
```

---

### Task 11: UI — Board (Client Component)

**Files:**
- Create: `src/app/reading/[id]/page.tsx`
- Create: `src/app/reading/[id]/board.tsx`

- [ ] **Step 1: Create board client component**

```tsx
// src/app/reading/[id]/board.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReadingPublic, RevealedCard } from "@/lib/types";

export default function Board({ reading: initial }: { reading: ReadingPublic }) {
  const [reading, setReading] = useState(initial);
  const [loading, setLoading] = useState<number | null>(null);
  const router = useRouter();

  const revealedMap = new Map(reading.revealed.map((r) => [r.position, r]));
  const canFinalize = reading.revealed.length >= reading.num_cartas && reading.status !== "finalizada";

  async function handleReveal(position: number) {
    if (revealedMap.has(position) || loading !== null) return;
    if (reading.revealed.length >= reading.num_cartas) return;

    setLoading(position);
    try {
      const res = await fetch(`/api/v1/readings/${reading.id}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position }),
      });
      if (!res.ok) return;
      const revealed: RevealedCard = await res.json();
      setReading((prev) => ({
        ...prev,
        status: "em_andamento",
        revealed: [...prev.revealed, revealed],
      }));
    } finally {
      setLoading(null);
    }
  }

  async function handleFinalize() {
    const res = await fetch(`/api/v1/readings/${reading.id}/finalize`, {
      method: "POST",
    });
    if (res.ok) {
      router.push(`/reading/${reading.id}/result`);
    }
  }

  return (
    <div className="p-4">
      <div className="mb-4 text-center">
        <p className="text-lg">
          Tipo: <strong>{reading.tipo}</strong> — Reveladas:{" "}
          <strong>{reading.revealed.length}/{reading.num_cartas}</strong>
        </p>
        {canFinalize && (
          <button
            onClick={handleFinalize}
            className="mt-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Finalizar
          </button>
        )}
      </div>
      <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-13 gap-2">
        {Array.from({ length: 78 }, (_, i) => {
          const revealed = revealedMap.get(i);
          const isLoading = loading === i;
          return (
            <button
              key={i}
              onClick={() => handleReveal(i)}
              disabled={!!revealed || loading !== null || reading.revealed.length >= reading.num_cartas}
              className={`aspect-[2/3] rounded-lg border-2 flex flex-col items-center justify-center text-xs p-1 transition-all ${
                revealed
                  ? "bg-white border-purple-500"
                  : isLoading
                    ? "bg-yellow-100 border-yellow-400 animate-pulse"
                    : "bg-gray-300 border-gray-400 hover:bg-gray-200 cursor-pointer"
              }`}
            >
              {revealed ? (
                <>
                  <span className="font-bold text-center">{revealed.card.nome_pt}</span>
                  {revealed.reversed && (
                    <span className="text-red-500 text-[10px]">invertida</span>
                  )}
                </>
              ) : (
                <span className="text-gray-500">{i}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create server page**

```tsx
// src/app/reading/[id]/page.tsx
import { notFound } from "next/navigation";
import { getReadingPublic } from "@/lib/readings/service";
import Board from "./board";

export default async function ReadingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reading = await getReadingPublic(id);

  if (!reading) notFound();

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold text-center mb-6">Sua Tiragem</h1>
      <Board reading={reading} />
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/reading/
git commit -m "feat: reading board UI (server page + client grid)"
```

---

### Task 12: UI — Result Page

**Files:**
- Create: `src/app/reading/[id]/result/page.tsx`

- [ ] **Step 1: Create result page**

```tsx
// src/app/reading/[id]/result/page.tsx
import { notFound } from "next/navigation";
import { getReadingPublic } from "@/lib/readings/service";
import Link from "next/link";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reading = await getReadingPublic(id);

  if (!reading || reading.status !== "finalizada") notFound();

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-2">Resultado</h1>
      <p className="text-center text-gray-500 mb-6">
        Tiragem: {reading.tipo} — {reading.num_cartas} carta(s)
      </p>
      <div className="space-y-4">
        {reading.revealed.map((r, idx) => (
          <div
            key={r.position}
            className="p-4 border rounded-lg flex items-center gap-4"
          >
            <span className="text-2xl font-bold text-purple-600">{idx + 1}</span>
            <div>
              <p className="font-semibold">{r.card.nome_pt}</p>
              <p className="text-sm text-gray-500">{r.card.nome}</p>
              {r.reversed && <p className="text-sm text-red-500">Invertida</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link href="/" className="text-purple-600 hover:underline">
          Nova tiragem
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/reading/
git commit -m "feat: result page showing selected cards"
```

---

### Task 13: E2E Test

**Files:**
- Create: `tests/e2e/reading-flow.spec.ts`

- [ ] **Step 1: Install Playwright browsers**

```bash
pnpm exec playwright install chromium
```

- [ ] **Step 2: Create E2E test**

```typescript
// tests/e2e/reading-flow.spec.ts
import { test, expect } from "@playwright/test";

test("full 3-card reading flow", async ({ request, page }) => {
  // 1. Create reading via API
  const createRes = await request.post("/api/v1/readings", {
    data: { tipo: "3_cartas" },
  });
  expect(createRes.ok()).toBeTruthy();
  const { id, num_cartas } = await createRes.json();
  expect(num_cartas).toBe(3);

  // 2. Open reading page
  await page.goto(`/reading/${id}`);
  await expect(page.locator("h1")).toContainText("Sua Tiragem");

  // 3. Click 3 unrevealed cards
  for (let i = 0; i < 3; i++) {
    const cards = page.locator("button.bg-gray-300");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    await cards.first().click();
    // Wait for the card to be revealed (turns white)
    await page.waitForTimeout(500);
  }

  // 4. Verify 3 cards revealed
  await expect(page.locator("text=3/3")).toBeVisible();

  // 5. Finalize
  const finalizeBtn = page.getByRole("button", { name: "Finalizar" });
  await expect(finalizeBtn).toBeVisible();
  await finalizeBtn.click();

  // 6. Verify result page
  await page.waitForURL(`**/reading/${id}/result`);
  await expect(page.locator("h1")).toContainText("Resultado");
  // Verify 3 cards displayed
  const resultCards = page.locator(".space-y-4 > div");
  await expect(resultCards).toHaveCount(3);
});

test("API never exposes deck_order", async ({ request }) => {
  const createRes = await request.post("/api/v1/readings", {
    data: { tipo: "1_carta" },
  });
  const reading = await createRes.json();
  expect(reading).not.toHaveProperty("deck_order");
  expect(reading).not.toHaveProperty("reverseds");

  const getRes = await request.get(`/api/v1/readings/${reading.id}`);
  const fetched = await getRes.json();
  expect(fetched).not.toHaveProperty("deck_order");
  expect(fetched).not.toHaveProperty("reverseds");
});
```

- [ ] **Step 3: Commit**

```bash
git add tests/
git commit -m "test: E2E for 3-card reading flow + API security check"
```

---

## Verification Checklist

- [ ] `pnpm test` — unit tests pass (deck + validation)
- [ ] `pnpm e2e` — E2E passes (flow + security)
- [ ] `pnpm dev` — app starts, manual create → reveal → finalize works
- [ ] API responses never contain `deck_order` or `reverseds`
- [ ] Migration SQL runs clean on empty database
- [ ] No `any` types, no lint warnings
- [ ] `pnpm build` succeeds
