import { NextRequest, NextResponse } from "next/server";
import { finalizeReading } from "@/lib/readings/service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
