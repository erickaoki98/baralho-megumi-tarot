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
    <main className="h-dvh overflow-hidden">
      <Board reading={reading} />
    </main>
  );
}
