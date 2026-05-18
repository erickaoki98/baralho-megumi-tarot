"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import type { ReadingPublic, RevealedCard } from "@/lib/types";

type Phase = "drawing" | "complete";

export default function Board({
  reading: initial,
}: {
  reading: ReadingPublic;
}) {
  const [reading, setReading] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>(
    initial.revealed.length >= initial.num_cartas ? "complete" : "drawing",
  );
  const [nextPosition, setNextPosition] = useState(initial.revealed.length);
  const [flippedSlots, setFlippedSlots] = useState<Set<number>>(
    () => new Set(initial.revealed.map((_, i) => i)),
  );
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const allRevealed = reading.revealed.length >= reading.num_cartas;

  const handleDraw = useCallback(async () => {
    if (loading || allRevealed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/readings/${reading.id}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: nextPosition }),
      });
      if (!res.ok) return;
      const revealed: RevealedCard = await res.json();

      const slotIndex = reading.revealed.length;
      setReading((prev) => ({
        ...prev,
        status: "em_andamento",
        revealed: [...prev.revealed, revealed],
      }));
      setNextPosition((p) => p + 1);

      setTimeout(() => {
        setFlippedSlots((prev) => new Set(prev).add(slotIndex));
      }, 150);

      if (slotIndex + 1 >= reading.num_cartas) {
        setTimeout(async () => {
          await fetch(`/api/v1/readings/${reading.id}/finalize`, {
            method: "POST",
          });
          setPhase("complete");
        }, 800);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, allRevealed, reading, nextPosition]);

  async function handleExportImage() {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, {
        pixelRatio: 2,
        backgroundColor: "#09090b",
      });
      const link = document.createElement("a");
      link.download = `megumi-tarot-${reading.id.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
    }
  }

  const deckCardsRemaining = 78 - reading.revealed.length;

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex-none flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-sm transition-opacity hover:opacity-100 opacity-60"
          style={{ color: "var(--gold)" }}
        >
          &larr; Voltar
        </Link>
        <h1 className="font-serif text-xl font-bold text-gold-gradient">
          {phase === "drawing" ? "Sua Tiragem" : "Resultado"}
        </h1>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {reading.revealed.length}/{reading.num_cartas}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex-none flex justify-center gap-2 px-6 pb-4">
        {Array.from({ length: reading.num_cartas }, (_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 max-w-12 rounded-full transition-all duration-500"
            style={{
              background:
                i < reading.revealed.length ? "var(--gold)" : "var(--bg-surface)",
              boxShadow:
                i < reading.revealed.length
                  ? "0 0 8px rgba(201,165,90,0.4)"
                  : "none",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 min-h-0">
        {phase === "drawing" ? (
          <>
            {/* Deck */}
            <button
              onClick={handleDraw}
              disabled={loading || allRevealed}
              className="press-scale relative cursor-pointer disabled:cursor-default group"
            >
              <div className="relative" style={{ width: 120, height: 170 }}>
                {[2, 1, 0].map((offset) => (
                  <div
                    key={offset}
                    className="absolute inset-0 rounded-xl transition-all duration-300"
                    style={{
                      background: "var(--card-back)",
                      border: "1px solid var(--card-border)",
                      transform: `rotate(${(offset - 1) * 2}deg) translateY(${-offset * 3}px)`,
                      opacity: deckCardsRemaining > offset ? 1 : 0.2,
                    }}
                  >
                    <div
                      className="absolute inset-[4px] rounded-lg border opacity-30"
                      style={{ borderColor: "var(--card-border)" }}
                    />
                  </div>
                ))}
                {/* Glow on hover */}
                {!allRevealed && (
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      boxShadow: "0 0 30px rgba(201,165,90,0.3)",
                    }}
                  />
                )}
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <svg
                      className="animate-spin h-8 w-8"
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
                  </div>
                )}
              </div>
              <p
                className="mt-3 text-sm text-center"
                style={{ color: "var(--text-secondary)" }}
              >
                Toque para revelar
              </p>
            </button>

            {/* Card slots */}
            <div className="flex flex-wrap justify-center gap-3">
              {Array.from({ length: reading.num_cartas }, (_, i) => {
                const revealed = reading.revealed[i];
                const isFlipped = flippedSlots.has(i);

                return (
                  <div
                    key={i}
                    className="perspective animate-fade-up"
                    style={{
                      width: slotWidth(reading.num_cartas),
                      aspectRatio: "2/3",
                      animationDelay: `${i * 80}ms`,
                    }}
                  >
                    <div
                      className={`card-inner relative w-full h-full ${isFlipped ? "flipped" : ""}`}
                    >
                      {/* Back face (empty slot) */}
                      <div
                        className="card-face card-back-face absolute inset-0 rounded-lg flex items-center justify-center"
                        style={{
                          background: revealed
                            ? "var(--card-back)"
                            : "transparent",
                          border: `1px dashed ${revealed ? "var(--card-border)" : "rgba(201,165,90,0.15)"}`,
                        }}
                      >
                        {!revealed && (
                          <span
                            className="text-lg font-serif font-bold opacity-20"
                            style={{ color: "var(--gold)" }}
                          >
                            {i + 1}
                          </span>
                        )}
                      </div>

                      {/* Front face (revealed card) */}
                      <div
                        className="card-face card-front-face absolute inset-0 rounded-lg flex flex-col items-center justify-center p-2 gap-1"
                        style={{
                          background:
                            "linear-gradient(145deg, #1a1028 0%, #13111a 50%, #1a1028 100%)",
                          border: "1px solid var(--gold)",
                          boxShadow: "0 0 20px rgba(201,165,90,0.2)",
                        }}
                      >
                        {revealed && (
                          <>
                            <span
                              className="text-xs font-serif font-bold text-center leading-tight"
                              style={{ color: "var(--gold-light)" }}
                            >
                              {revealed.card.nome_pt}
                            </span>
                            {revealed.reversed && (
                              <span
                                className="text-[10px] font-medium"
                                style={{ color: "#e57373" }}
                              >
                                Invertida
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* Result cards */}
            <div
              ref={exportRef}
              className="flex flex-col items-center gap-5 p-6 rounded-2xl w-full max-w-2xl"
              style={{ background: "var(--bg-deep)" }}
            >
              <p
                className="font-serif text-2xl font-bold text-gold-gradient"
              >
                Megumi Tarot
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                {reading.revealed.map((r, idx) => (
                  <div
                    key={r.position}
                    className="animate-fade-up flex flex-col items-center gap-2 p-3 rounded-xl"
                    style={{
                      animationDelay: `${idx * 100}ms`,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--card-border)",
                      width: slotWidth(reading.num_cartas),
                    }}
                  >
                    <span
                      className="text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center"
                      style={{
                        background: "var(--gold-dim)",
                        color: "var(--gold)",
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span
                      className="text-xs font-serif font-bold text-center leading-tight"
                      style={{ color: "var(--gold-light)" }}
                    >
                      {r.card.nome_pt}
                    </span>
                    <span
                      className="text-[10px] text-center"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {r.card.nome}
                    </span>
                    {r.reversed && (
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: "#e57373" }}
                      >
                        Invertida
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <p
                className="text-[10px] tracking-wider uppercase"
                style={{ color: "var(--text-secondary)" }}
              >
                baralho.megumitarot.com.br
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={handleExportImage}
                disabled={exporting}
                className="btn-shimmer glow-pulse press-scale px-10 py-3 rounded-full cursor-pointer font-serif text-lg font-semibold tracking-wide transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none"
                style={{ color: "var(--bg-deep)" }}
              >
                {exporting ? "Gerando…" : "Gerar Imagem"}
              </button>
              <Link
                href="/"
                className="press-scale px-8 py-3 rounded-full font-serif text-base font-medium tracking-wide transition-all duration-200 hover:scale-105"
                style={{
                  color: "var(--gold)",
                  border: "1px solid var(--card-border)",
                  background: "var(--gold-dim)",
                }}
              >
                Nova Tiragem
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function slotWidth(numCartas: number): number {
  if (numCartas <= 3) return 80;
  if (numCartas <= 5) return 68;
  if (numCartas <= 7) return 58;
  return 50;
}
