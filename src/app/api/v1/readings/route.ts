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
