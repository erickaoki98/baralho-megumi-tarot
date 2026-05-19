"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import type { ReadingPublic, RevealedCard } from "@/lib/types";

type Phase = "picking" | "result";

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
  const [phase, setPhase] = useState<Phase>(
    initial.revealed.length >= initial.num_cartas ? "result" : "picking",
  );
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

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

      if (reading.revealed.length + 1 >= reading.num_cartas) {
        setTimeout(async () => {
          await fetch(`/api/v1/readings/${reading.id}/finalize`, {
            method: "POST",
          });
          setPhase("result");
        }, 700);
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleExportImage() {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, {
        pixelRatio: 2,
        backgroundColor: "#FDF6F0",
      });
      const link = document.createElement("a");
      link.download = `megumi-tarot-${reading.id.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
    }
  }

  if (phase === "result") {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-none flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--card-border)" }}>
          <Link href="/" className="text-sm font-medium" style={{ color: "var(--primary)" }}>
            ✦ Nova tiragem
          </Link>
          <span className="font-serif text-lg font-bold" style={{ color: "var(--text)" }}>
            Resultado
          </span>
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {reading.num_cartas} carta{reading.num_cartas > 1 ? "s" : ""}
          </span>
        </div>

        {/* Result content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-4 min-h-0">
          <div
            ref={exportRef}
            className="flex flex-col items-center gap-4 p-5 rounded-2xl w-full max-w-md"
            style={{ background: "white", border: "1px solid var(--card-border)" }}
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
                    background: "var(--bg)",
                    border: "1px solid var(--card-border)",
                    minWidth: 80,
                    flex: "1 1 80px",
                    maxWidth: 120,
                  }}
                >
                  <span
                    className="text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center"
                    style={{ background: "var(--primary-dim)", color: "var(--primary)" }}
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
              onClick={handleExportImage}
              disabled={exporting}
              className="btn-primary press-scale px-8 py-2.5 rounded-full cursor-pointer font-medium text-sm tracking-wide transition-all hover:scale-105 disabled:opacity-50"
            >
              {exporting ? "Gerando…" : "Gerar Imagem"}
            </button>
            <Link
              href="/"
              className="press-scale px-6 py-2.5 rounded-full font-medium text-sm tracking-wide transition-all hover:scale-105"
              style={{
                color: "var(--primary)",
                border: "1.5px solid var(--card-border)",
                background: "white",
              }}
            >
              Voltar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "var(--card-border)" }}>
        <Link href="/" className="text-xs font-medium" style={{ color: "var(--primary)" }}>
          ✦ Voltar
        </Link>
        <span className="font-serif text-base font-bold" style={{ color: "var(--text)" }}>
          Escolha suas cartas
        </span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: allRevealed ? "var(--primary)" : "var(--primary-dim)",
            color: allRevealed ? "white" : "var(--primary)",
          }}
        >
          {reading.revealed.length}/{reading.num_cartas}
        </span>
      </div>

      {/* Progress */}
      <div className="flex-none flex gap-1 px-3 py-1">
        {Array.from({ length: reading.num_cartas }, (_, i) => (
          <div
            key={i}
            className="h-0.5 flex-1 rounded-full transition-all duration-400"
            style={{
              background: i < reading.revealed.length ? "var(--primary)" : "var(--primary-dim)",
            }}
          />
        ))}
      </div>

      {/* Card grid — fills remaining space, no scroll */}
      <div className="flex-1 min-h-0 px-1.5 py-1">
        <div className="h-full grid grid-cols-6 grid-rows-[repeat(13,1fr)] sm:grid-cols-8 sm:grid-rows-[repeat(10,1fr)] md:grid-cols-10 md:grid-rows-[repeat(8,1fr)] lg:grid-cols-13 lg:grid-rows-[repeat(6,1fr)] gap-[3px]">
          {Array.from({ length: 78 }, (_, i) => {
            const revealed = revealedMap.get(i);
            const isFlipped = flipped.has(i);
            const isLoading = loading === i;
            const isDisabled = !!revealed || loading !== null || allRevealed;

            return (
              <button
                key={i}
                onClick={() => handleReveal(i)}
                disabled={isDisabled}
                className="perspective w-full h-full cursor-pointer disabled:cursor-default"
              >
                <div className={`card-inner relative w-full h-full ${isFlipped ? "flipped" : ""}`}>
                  {/* Back */}
                  <div
                    className={`card-face card-back-face absolute inset-0 rounded-lg flex items-center justify-center ${!isDisabled ? "card-hover" : ""}`}
                    style={{
                      background: `linear-gradient(145deg, var(--card-back-1), var(--card-back-2))`,
                      border: isLoading
                        ? "2px solid var(--primary)"
                        : "1px solid var(--card-border)",
                      boxShadow: isLoading
                        ? "0 0 12px rgba(192,123,160,0.3)"
                        : "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    {isLoading ? (
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="var(--primary)" strokeWidth="3" />
                        <path className="opacity-75" fill="var(--primary)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <span
                        className="text-[9px] font-medium opacity-30"
                        style={{ color: "var(--primary)" }}
                      >
                        {i + 1}
                      </span>
                    )}
                  </div>

                  {/* Front */}
                  <div
                    className="card-face card-front-face absolute inset-0 rounded-lg flex flex-col items-center justify-center p-1"
                    style={{
                      background: "white",
                      border: "1.5px solid var(--accent)",
                      boxShadow: "0 2px 8px rgba(212,167,106,0.2)",
                    }}
                  >
                    {revealed && (
                      <>
                        <span
                          className="text-[8px] sm:text-[9px] font-serif font-bold text-center leading-tight"
                          style={{ color: "var(--text)" }}
                        >
                          {revealed.card.nome_pt}
                        </span>

                      </>
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
