import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createReading } from "@/lib/readings/service";
import { MIN_CARTAS, MAX_CARTAS } from "@/lib/types";

const CreateReadingSchema = z.object({
  num_cartas: z.number().int().min(MIN_CARTAS).max(MAX_CARTAS),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = CreateReadingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  try {
    const reading = await createReading(parsed.data.num_cartas);
    return NextResponse.json(reading, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
