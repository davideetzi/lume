import Link from "next/link";
import { Logo } from "./logo";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="inline-flex items-baseline gap-3"
          aria-label="Lume, prodotto Humanev"
        >
          <Logo size="sm" />
          <span className="text-foreground-muted">·</span>
          <span className="text-lg font-medium text-navy">Lume</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-foreground-muted sm:flex">
          <Link href="/onboarding" className="hover:text-navy">
            Come funziona
          </Link>
          <Link href="/tos" className="hover:text-navy">
            Termini
          </Link>
          <Link
            href="/signin"
            className="rounded-md bg-navy px-4 py-2 text-white hover:bg-navy-soft"
          >
            Accedi
          </Link>
        </nav>
      </div>
    </header>
  );
}
