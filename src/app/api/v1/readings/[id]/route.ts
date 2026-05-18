import { NextRequest, NextResponse } from "next/server";
import { getReadingPublic } from "@/lib/readings/service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const reading = await getReadingPublic(id);
  if (!reading) {
    return NextResponse.json({ error: "Reading not found" }, { status: 404 });
  }

  return NextResponse.json(reading);
}
