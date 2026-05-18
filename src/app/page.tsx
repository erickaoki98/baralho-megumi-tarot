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
    <main className="h-dvh flex flex-col items-center justify-center px-6 overflow-hidden relative">
      {/* Decorative dots */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="float-dot absolute rounded-full pointer-events-none"
          style={{
            width: 6 + i * 2,
            height: 6 + i * 2,
            background: i % 2 === 0 ? "var(--primary-light)" : "var(--accent-light)",
            left: `${12 + i * 19}%`,
            top: `${18 + ((i * 29) % 50)}%`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center gap-10 max-w-sm w-full">
        {/* Logo / Title */}
        <div className="text-center">
          <p
            className="text-sm tracking-[0.2em] uppercase mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            ✦ Tiragem Online ✦
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl font-bold text-title-gradient leading-tight">
            Megumi Tarot
          </h1>
        </div>

        {/* Card count */}
        <div className="flex flex-col items-center gap-4 w-full">
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Quantas cartas?
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {Array.from(
              { length: MAX_CARTAS - MIN_CARTAS + 1 },
              (_, i) => i + MIN_CARTAS,
            ).map((n) => {
              const selected = n === numCartas;
              return (
                <button
                  key={n}
                  onClick={() => setNumCartas(n)}
                  className="press-scale h-11 w-11 rounded-full cursor-pointer font-medium text-sm transition-all duration-200"
                  style={{
                    background: selected ? "var(--primary)" : "white",
                    color: selected ? "white" : "var(--text-secondary)",
                    border: selected ? "none" : "1.5px solid var(--card-border)",
                    boxShadow: selected
                      ? "0 2px 12px rgba(192,123,160,0.3)"
                      : "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Shuffle button */}
        <button
          onClick={handleShuffle}
          disabled={loading}
          className="btn-primary press-scale px-14 py-4 rounded-full cursor-pointer font-serif text-xl font-semibold tracking-wide transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
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
            "Embaralhar ✦"
          )}
        </button>
      </div>
    </main>
  );
}
