"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReadingPublic, RevealedCard } from "@/lib/types";

export default function Board({ reading: initial }: { reading: ReadingPublic }) {
  const [reading, setReading] = useState(initial);
  const [loading, setLoading] = useState<number | null>(null);
  const router = useRouter();

  const revealedMap = new Map(reading.revealed.map((r) => [r.position, r]));
  const allRevealed = reading.revealed.length >= reading.num_cartas;

  async function handleReveal(position: number) {
    if (revealedMap.has(position) || loading !== null) return;
    if (allRevealed) return;

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
          <strong>
            {reading.revealed.length}/{reading.num_cartas}
          </strong>
        </p>
        {allRevealed && reading.status !== "finalizada" && (
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
              disabled={!!revealed || loading !== null || allRevealed}
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
                  <span className="font-bold text-center leading-tight">
                    {revealed.card.nome_pt}
                  </span>
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
