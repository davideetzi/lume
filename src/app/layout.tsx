import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/brand/site-header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lume · Profilo cognitivo orientativo",
    template: "%s · Lume",
  },
  description:
    "Lume è una batteria cognitiva orientativa basata sul modello CHC. Restituisce un ritratto descrittivo dei tuoi processi cognitivi. Non è un test del QI, non è uno strumento diagnostico.",
  applicationName: "Lume",
  authors: [{ name: "Humanev" }],
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-surface text-foreground">
        <SiteHeader />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
