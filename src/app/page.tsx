import { redirect } from "next/navigation";
import { createReading } from "@/lib/readings/service";

export const dynamic = "force-dynamic";

const NUM_CARTAS = 6;

export default async function Home() {
  const reading = await createReading(NUM_CARTAS);
  redirect(`/reading/${reading.id}`);
}
