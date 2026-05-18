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
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-8">
      <div
        className="flex flex-col items-center gap-4 p-6 rounded-2xl w-full max-w-md"
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
              <span className="text-[10px] text-center" style={{ color: "var(--text-secondary)" }}>
                {r.card.nome}
              </span>
              {r.reversed && (
                <span className="text-[10px] font-medium" style={{ color: "var(--danger)" }}>
                  Invertida
                </span>
              )}
            </div>
          ))}
        </div>

        <p className="text-[9px] tracking-wider uppercase" style={{ color: "var(--text-secondary)" }}>
          baralho.megumitarot.com.br
        </p>
      </div>

      <Link
        href="/"
        className="press-scale mt-6 px-8 py-2.5 rounded-full font-medium text-sm"
        style={{
          color: "var(--primary)",
          border: "1.5px solid var(--card-border)",
          background: "white",
        }}
      >
        Nova Tiragem
      </Link>
    </main>
  );
}
