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
