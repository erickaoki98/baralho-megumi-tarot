import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-7xl font-serif font-bold text-title-gradient">404</p>
      <p className="mt-3 text-base" style={{ color: "var(--text-secondary)" }}>
        Esta carta não foi encontrada no baralho
      </p>
      <Link
        href="/"
        className="press-scale mt-6 px-8 py-2.5 rounded-full font-medium text-sm transition-all hover:scale-105"
        style={{
          color: "var(--primary)",
          border: "1.5px solid var(--card-border)",
          background: "white",
        }}
      >
        Voltar ao Início
      </Link>
    </main>
  );
}
