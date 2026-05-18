import { notFound } from "next/navigation";
import { getReadingPublic } from "@/lib/readings/service";
import Link from "next/link";
import Board from "./board";

export default async function ReadingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reading = await getReadingPublic(id);

  if (!reading) notFound();

  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden px-4 py-8 sm:py-12">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(147,51,234,0.15) 0%, rgba(201,165,90,0.08) 40%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-5xl">
        <Link
          href="/"
          className="self-start text-sm transition-opacity hover:opacity-100 opacity-60"
          style={{ color: "var(--gold)" }}
        >
          &larr; Nova tiragem
        </Link>

        <div className="text-center">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gold-gradient leading-tight tracking-tight">
            Sua Tiragem
          </h1>
          <p
            className="mt-2 text-sm tracking-widest uppercase"
            style={{ color: "var(--text-secondary)" }}
          >
            Escolha {reading.num_cartas} carta{reading.num_cartas > 1 ? "s" : ""} do baralho
          </p>
        </div>

        <Board reading={reading} />
      </div>
    </main>
  );
}
