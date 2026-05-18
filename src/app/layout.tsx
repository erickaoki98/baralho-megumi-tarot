import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Megumi Tarot",
  description: "Tiragem de tarô online — Megumi Tarot",
  metadataBase: new URL("https://baralho.megumitarot.com.br"),
  openGraph: {
    title: "Megumi Tarot",
    description: "Descubra o que as cartas revelam — tiragem de tarô online",
    siteName: "Megumi Tarot",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Megumi Tarot",
    description: "Descubra o que as cartas revelam — tiragem de tarô online",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
