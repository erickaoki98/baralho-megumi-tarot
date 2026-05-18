"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReadingPublic, RevealedCard } from "@/lib/types";

export default function Board({
  reading: initial,
}: {
  reading: ReadingPublic;
}) {
  const [reading, setReading] = useState(initial);
  const [loading, setLoading] = useState<number | null>(null);
  const [flipped, setFlipped] = useState<Set<number>>(
    () => new Set(initial.revealed.map((r) => r.position)),
  );
  const [finalizing, setFinalizing] = useState(false);
  const router = useRouter();

  const revealedMap = new Map(reading.revealed.map((r) => [r.position, r]));
  const allRevealed = reading.revealed.length >= reading.num_cartas;

  async function handleReveal(position: number) {
    if (revealedMap.has(position) || loading !== null || allRevealed) return;

    setLoading(position);
    try {
      const res = await fetch(`/api/v1/readings/${reading.id}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position }),
      });
      if (!res.ok) return;
      const revealed: RevealedCard = await res.json();
      setFlipped((prev) => new Set(prev).add(position));
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
    setFinalizing(true);
    try {
      const res = await fetch(`/api/v1/readings/${reading.id}/finalize`, {
        method: "POST",
      });
      if (res.ok) {
        router.push(`/reading/${reading.id}/result`);
      }
    } finally {
      setFinalizing(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Progress */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          {Array.from({ length: reading.num_cartas }, (_, i) => (
            <div
              key={i}
              className="h-2 w-8 rounded-full transition-all duration-500"
              style={{
                background:
                  i < reading.revealed.length
                    ? "var(--gold)"
                    : "var(--bg-surface)",
                boxShadow:
                  i < reading.revealed.length
                    ? "0 0 8px rgba(201,165,90,0.4)"
                    : "none",
              }}
            />
          ))}
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {reading.revealed.length} de {reading.num_cartas} carta
          {reading.num_cartas > 1 ? "s" : ""} revelada
          {reading.revealed.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Instruction */}
      {!allRevealed && (
        <p
          className="text-sm text-center animate-fade-up"
          style={{ color: "var(--text-secondary)" }}
        >
          Toque em uma carta para revelá-la
        </p>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-13 gap-1.5 sm:gap-2 w-full max-w-5xl">
        {Array.from({ length: 78 }, (_, i) => {
          const revealed = revealedMap.get(i);
          const isFlipped = flipped.has(i);
          const isLoading = loading === i;

          return (
            <div
              key={i}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i * 15, 600)}ms` }}
            >
              <button
                onClick={() => handleReveal(i)}
                disabled={!!revealed || loading !== null || allRevealed}
                className="perspective w-full aspect-[2/3] cursor-pointer disabled:cursor-default group"
              >
                <div className={`card-inner relative w-full h-full ${isFlipped ? "flipped" : ""}`}>
                  {/* Back face */}
                  <div
                    className="card-face card-back-face absolute inset-0 rounded-lg flex items-center justify-center transition-shadow duration-300"
                    style={{
                      background: "var(--card-back)",
                      border: `1px solid ${isLoading ? "var(--gold)" : "var(--card-border)"}`,
                      boxShadow: isLoading
                        ? "0 0 20px rgba(201,165,90,0.4)"
                        : "none",
                    }}
                  >
                    <div
                      className="absolute inset-[3px] rounded-md border opacity-40"
                      style={{ borderColor: "var(--card-border)" }}
                    />
                    {isLoading ? (
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="var(--gold)"
                          strokeWidth="3"
                        />
                        <path
                          className="opacity-75"
                          fill="var(--gold)"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <span
                        className="text-[10px] font-medium opacity-30 group-hover:opacity-60 transition-opacity"
                        style={{ color: "var(--gold)" }}
                      >
                        {i + 1}
                      </span>
                    )}
                  </div>

                  {/* Front face */}
                  <div
                    className="card-face card-front-face absolute inset-0 rounded-lg flex flex-col items-center justify-center p-1 gap-0.5"
                    style={{
                      background:
                        "linear-gradient(145deg, #1a1028 0%, #13111a 50%, #1a1028 100%)",
                      border: "1px solid var(--gold)",
                      boxShadow: "0 0 15px rgba(201,165,90,0.2)",
                    }}
                  >
                    {revealed && (
                      <>
                        <span
                          className="text-[9px] sm:text-[10px] font-serif font-bold text-center leading-tight"
                          style={{ color: "var(--gold-light)" }}
                        >
                          {revealed.card.nome_pt}
                        </span>
                        {revealed.reversed && (
                          <span
                            className="text-[8px] sm:text-[9px] font-medium"
                            style={{ color: "#e57373" }}
                          >
                            Invertida
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Finalize */}
      {allRevealed && reading.status !== "finalizada" && (
        <div className="animate-fade-up flex flex-col items-center gap-3 mt-2">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Todas as cartas foram reveladas
          </p>
          <button
            onClick={handleFinalize}
            disabled={finalizing}
            className="btn-shimmer glow-pulse press-scale px-10 py-3 rounded-full cursor-pointer font-serif text-lg font-semibold tracking-wide transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: "var(--bg-deep)" }}
          >
            {finalizing ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Finalizando…
              </span>
            ) : (
              "Ver Resultado"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
