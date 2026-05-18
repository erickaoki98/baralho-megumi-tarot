"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MIN_CARTAS, MAX_CARTAS } from "@/lib/types";

export default function Home() {
  const [numCartas, setNumCartas] = useState(3);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleShuffle() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_cartas: numCartas }),
      });
      if (!res.ok) return;
      const data = await res.json();
      router.push(`/reading/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative h-dvh flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(147,51,234,0.18) 0%, rgba(201,165,90,0.1) 40%, transparent 70%)",
          }}
        />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="float-particle absolute h-1.5 w-1.5 rounded-full"
            style={{
              background: "var(--gold)",
              left: `${10 + i * 13}%`,
              top: `${15 + ((i * 31) % 55)}%`,
              animationDelay: `${i * 0.9}s`,
              animationDuration: `${4 + i * 1.2}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-12 max-w-lg w-full">
        {/* Title */}
        <div className="text-center">
          <h1 className="font-serif text-6xl sm:text-7xl lg:text-8xl font-bold text-gold-gradient leading-none tracking-tight">
            Megumi Tarot
          </h1>
          <p
            className="mt-4 text-base tracking-[0.25em] uppercase"
            style={{ color: "var(--text-secondary)" }}
          >
            Descubra o que as cartas revelam
          </p>
        </div>

        {/* Card count selector */}
        <div className="flex flex-col items-center gap-5 w-full">
          <p
            className="text-base font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Quantas cartas deseja revelar?
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {Array.from(
              { length: MAX_CARTAS - MIN_CARTAS + 1 },
              (_, i) => i + MIN_CARTAS,
            ).map((n) => {
              const selected = n === numCartas;
              return (
                <button
                  key={n}
                  onClick={() => setNumCartas(n)}
                  className="press-scale relative h-12 w-12 rounded-full cursor-pointer font-medium text-base transition-all duration-200 focus:outline-none"
                  style={{
                    background: selected ? "var(--gold)" : "var(--bg-surface)",
                    color: selected ? "var(--bg-deep)" : "var(--text-secondary)",
                    border: selected
                      ? "2px solid var(--gold)"
                      : "1px solid rgba(201,165,90,0.2)",
                    boxShadow: selected
                      ? "0 0 24px rgba(201,165,90,0.35)"
                      : "none",
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Embaralhar button */}
        <button
          onClick={handleShuffle}
          disabled={loading}
          className="btn-shimmer glow-pulse press-scale relative px-16 py-5 rounded-full cursor-pointer font-serif text-2xl font-semibold tracking-wide transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none"
          style={{ color: "var(--bg-deep)" }}
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <svg
                className="animate-spin h-6 w-6"
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
              Embaralhando…
            </span>
          ) : (
            "Embaralhar"
          )}
        </button>
      </div>
    </main>
  );
}
