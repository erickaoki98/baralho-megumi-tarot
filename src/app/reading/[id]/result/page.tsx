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
            <span className="text-2xl font-bold text-purple-600">
              {idx + 1}
            </span>
            <div>
              <p className="font-semibold">{r.card.nome_pt}</p>
              <p className="text-sm text-gray-500">{r.card.nome}</p>
              {r.reversed && (
                <p className="text-sm text-red-500">Invertida</p>
              )}
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
