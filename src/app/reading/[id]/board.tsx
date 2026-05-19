"use client";

import { useState, useEffect } from "react";
import type { ReadingPublic, RevealedCard } from "@/lib/types";

type Phase = "picking" | "result";

const MYSTICAL_ICONS = [
  // Star
  <svg key="star" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z"/></svg>,
  // Moon
  <svg key="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/></svg>,
  // Eye
  <svg key="eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>,
  // Crystal
  <svg key="crystal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M12 2L6 10l6 12 6-12-6-8z"/><path d="M6 10h12"/></svg>,
  // Sun
  <svg key="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="12" cy="12" r="4"/><path d="M12 2v4m0 12v4m10-10h-4M6 12H2m17.07-7.07l-2.83 2.83M9.76 14.24l-2.83 2.83m0-10.14l2.83 2.83m4.48 4.48l2.83 2.83"/></svg>,
  // Lotus
  <svg key="lotus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M12 22c-4-4-8-8-8-13a8 8 0 0116 0c0 5-4 9-8 13z"/><path d="M12 6v10m-4-6c2 2 4 2 4 2s2 0 4-2"/></svg>,
];

function getIcon(index: number) {
  return MYSTICAL_ICONS[index % MYSTICAL_ICONS.length];
}

export default function Board({
  reading: initial,
}: {
  reading: ReadingPublic;
}) {
  const [reading, setReading] = useState(initial);
  const [loading, setLoading] = useState<Set<number>>(() => new Set());
  const [flipped, setFlipped] = useState<Set<number>>(
    () => new Set(initial.revealed.map((r) => r.position)),
  );
  const [phase, setPhase] = useState<Phase>(
    initial.revealed.length >= initial.num_cartas ? "result" : "picking",
  );

  const ALLOWED_ORIGINS = [
    "https://app.megumitarot.com.br",
    "https://preview--creative-sales-aid.lovable.app",
  ];

  function postToParent(text: string) {
    for (const origin of ALLOWED_ORIGINS) {
      window.parent.postMessage({ type: "megumi-tarot-result", text }, origin);
    }
  }

  useEffect(() => {
    if (phase !== "result") return;
    const text = reading.revealed
      .map((r, i) => `${i + 1}. ${r.card.nome_pt}`)
      .join("\n");
    postToParent(text);
  }, [phase, reading.revealed]);

  const revealedMap = new Map(reading.revealed.map((r) => [r.position, r]));
  const allRevealed = reading.revealed.length >= reading.num_cartas;

  const revealedCount = reading.revealed.length;

  async function handleReveal(position: number) {
    if (revealedMap.has(position) || loading.has(position) || allRevealed) return;

    setLoading((prev) => new Set(prev).add(position));
    try {
      const res = await fetch(`/api/v1/readings/${reading.id}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position }),
      });
      if (!res.ok) return;
      const revealed: RevealedCard = await res.json();
      setFlipped((prev) => new Set(prev).add(position));
      setReading((prev) => {
        const updated = {
          ...prev,
          status: "em_andamento" as const,
          revealed: [...prev.revealed, revealed],
        };
        if (updated.revealed.length >= prev.num_cartas) {
          fetch(`/api/v1/readings/${prev.id}/finalize`, { method: "POST" });
          setTimeout(() => setPhase("result"), 600);
        }
        return updated;
      });
    } finally {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(position);
        return next;
      });
    }
  }

  if (phase === "result") {
    return (
      <div className="h-full flex flex-col">
        <div
          className="flex-none flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: "var(--card-border)" }}
        >
          <a href="/" className="text-sm font-medium" style={{ color: "var(--primary)" }}>
            ✦ Nova tiragem
          </a>
          <span className="font-serif text-lg font-bold" style={{ color: "var(--text)" }}>
            Resultado
          </span>
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {reading.num_cartas} carta{reading.num_cartas > 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-4 min-h-0">
          <div
            className="flex flex-col items-center gap-4 p-5 rounded-2xl w-full max-w-md"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--card-border)" }}
          >
            <p className="font-serif text-xl font-bold text-title-gradient">
              ✦ Megumi Tarot ✦
            </p>

            <div className="flex flex-wrap justify-center gap-3 w-full">
              {reading.revealed.map((r, idx) => (
                <div
                  key={r.position}
                  className="animate-fade-up flex flex-col items-center gap-1.5 p-3 rounded-xl"
                  style={{
                    animationDelay: `${idx * 80}ms`,
                    background: "rgba(201, 160, 220, 0.06)",
                    border: "1px solid var(--card-border)",
                    minWidth: 80,
                    flex: "1 1 80px",
                    maxWidth: 120,
                  }}
                >
                  <span
                    className="text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center"
                    style={{ background: "var(--primary-dim)", color: "var(--accent)" }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className="text-xs font-serif font-bold text-center leading-tight"
                    style={{ color: "var(--text)" }}
                  >
                    {r.card.nome_pt}
                  </span>
                  <span
                    className="text-[10px] text-center"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {r.card.nome}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[9px] tracking-wider uppercase" style={{ color: "var(--text-secondary)" }}>
              baralho.megumitarot.com.br
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                const text = reading.revealed
                  .map((r, i) => `${i + 1}. ${r.card.nome_pt}`)
                  .join("\n");
                postToParent(text);
              }}
              className="btn-primary press-scale px-8 py-2.5 rounded-full cursor-pointer font-medium text-sm tracking-wide transition-all hover:scale-105"
            >
              Enviar Resultado
            </button>
            <a
              href="/"
              className="press-scale px-6 py-2.5 rounded-full font-medium text-sm tracking-wide transition-all hover:scale-105"
              style={{
                color: "var(--primary)",
                border: "1.5px solid var(--card-border)",
                background: "var(--bg-surface)",
              }}
            >
              Nova Tiragem
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div
        className="flex-none flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: "var(--card-border)" }}
      >
        <a href="/" className="text-xs font-medium" style={{ color: "var(--primary)" }}>
          ✦ Voltar
        </a>
        <span className="font-serif text-base font-bold" style={{ color: "var(--text)" }}>
          Escolha suas cartas
        </span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: allRevealed ? "var(--primary)" : "var(--primary-dim)",
            color: allRevealed ? "var(--bg)" : "var(--primary)",
          }}
        >
          {reading.revealed.length}/{reading.num_cartas}
        </span>
      </div>

      <div className="flex-none flex gap-1 px-3 py-1">
        {Array.from({ length: reading.num_cartas }, (_, i) => (
          <div
            key={i}
            className="h-0.5 flex-1 rounded-full transition-all duration-400"
            style={{
              background: i < reading.revealed.length ? "var(--accent)" : "var(--primary-dim)",
            }}
          />
        ))}
      </div>

      <div className="flex-1 min-h-0 px-1.5 py-1">
        <div className="h-full grid grid-cols-6 grid-rows-[repeat(13,1fr)] sm:grid-cols-8 sm:grid-rows-[repeat(10,1fr)] md:grid-cols-10 md:grid-rows-[repeat(8,1fr)] lg:grid-cols-13 lg:grid-rows-[repeat(6,1fr)] gap-[3px]">
          {Array.from({ length: 78 }, (_, i) => {
            const revealed = revealedMap.get(i);
            const isFlipped = flipped.has(i);
            const isLoading = loading.has(i);
            const isDisabled = !!revealed || isLoading || allRevealed;

            return (
              <button
                key={i}
                onClick={() => handleReveal(i)}
                disabled={isDisabled}
                className="perspective w-full h-full cursor-pointer disabled:cursor-default"
              >
                <div className={`card-inner relative w-full h-full ${isFlipped ? "flipped" : ""}`}>
                  {/* Back — mystical design */}
                  <div
                    className={`card-face card-back-face card-back-pattern absolute inset-0 rounded-lg flex flex-col items-center justify-center ${!isDisabled ? "card-hover" : ""}`}
                    style={{
                      border: isLoading
                        ? "1.5px solid var(--accent)"
                        : "1px solid var(--card-border)",
                      boxShadow: isLoading
                        ? "0 0 14px rgba(240,192,96,0.3)"
                        : "0 1px 4px rgba(0,0,0,0.3)",
                    }}
                  >
                    {isLoading ? (
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="3" />
                        <path className="opacity-75" fill="var(--accent)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <span
                        className="card-star w-[40%] h-[40%] opacity-40"
                        style={{ color: "var(--primary)", animationDelay: `${(i * 0.7) % 3}s` }}
                      >
                        {getIcon(i)}
                      </span>
                    )}
                  </div>

                  {/* Front — revealed card */}
                  <div
                    className="card-face card-front-face absolute inset-0 rounded-lg flex flex-col items-center justify-center p-1"
                    style={{
                      background: "linear-gradient(145deg, #2A1E40, #1E1630)",
                      border: "1.5px solid var(--accent)",
                      boxShadow: "0 2px 10px rgba(240,192,96,0.15)",
                    }}
                  >
                    {revealed && (
                      <span
                        className="text-[8px] sm:text-[9px] font-serif font-bold text-center leading-tight"
                        style={{ color: "var(--accent)" }}
                      >
                        {revealed.card.nome_pt}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
