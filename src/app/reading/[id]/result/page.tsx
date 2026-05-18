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
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden px-4 py-8 sm:py-12">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(147,51,234,0.15) 0%, rgba(201,165,90,0.08) 40%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gold-gradient leading-tight tracking-tight">
            Resultado
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            {reading.num_cartas} carta{reading.num_cartas > 1 ? "s" : ""}{" "}
            revelada{reading.num_cartas > 1 ? "s" : ""}
          </p>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-4 w-full">
          {reading.revealed.map((r, idx) => (
            <div
              key={r.position}
              className="animate-fade-up flex items-center gap-4 p-5 rounded-xl"
              style={{
                animationDelay: `${idx * 100}ms`,
                background: "var(--bg-surface)",
                border: "1px solid var(--card-border)",
              }}
            >
              <div
                className="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center font-serif text-lg font-bold"
                style={{
                  background: "var(--gold-dim)",
                  color: "var(--gold)",
                  border: "1px solid var(--card-border)",
                }}
              >
                {idx + 1}
              </div>
              <div className="flex flex-col gap-0.5">
                <p
                  className="font-serif font-semibold text-lg"
                  style={{ color: "var(--gold-light)" }}
                >
                  {r.card.nome_pt}
                </p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {r.card.nome}
                </p>
                {r.reversed && (
                  <p className="text-sm font-medium" style={{ color: "#e57373" }}>
                    Invertida
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* New reading link */}
        <Link
          href="/"
          className="press-scale mt-2 px-8 py-3 rounded-full font-serif text-base font-medium tracking-wide transition-all duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            color: "var(--gold)",
            border: "1px solid var(--card-border)",
            background: "var(--gold-dim)",
          }}
        >
          Nova Tiragem
        </Link>
      </div>
    </main>
  );
}
