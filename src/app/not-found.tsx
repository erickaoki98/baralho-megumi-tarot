import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p
        className="text-8xl font-serif font-bold"
        style={{ color: "var(--gold)" }}
      >
        404
      </p>
      <p className="mt-4 text-lg" style={{ color: "var(--text-secondary)" }}>
        Esta carta não foi encontrada no baralho
      </p>
      <Link
        href="/"
        className="press-scale mt-8 px-8 py-3 rounded-full font-serif text-base font-medium tracking-wide transition-all duration-200 hover:scale-105"
        style={{
          color: "var(--gold)",
          border: "1px solid var(--card-border)",
          background: "var(--gold-dim)",
        }}
      >
        Voltar ao Início
      </Link>
    </main>
  );
}
