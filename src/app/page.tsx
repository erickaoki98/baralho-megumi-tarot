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
