import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui/page-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { auth } from "@/auth";

export const metadata = { title: "Crea il tuo accesso" };

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/consent");
  }

  return (
    <PageShell
      title="Crea il tuo accesso"
      intro="Bastano pochi dati. Servono per salvare il tuo profilo e per permetterti di sospendere e riprendere la sessione."
      maxWidth="sm"
    >
      <SignupForm />
      <p className="mt-8 text-sm text-foreground-muted">
        Hai già un account?{" "}
        <Link href="/signin" className="underline hover:text-navy">
          Accedi
        </Link>
        .
      </p>
      <p className="mt-3 text-xs text-foreground-muted">
        Procedendo accetti i{" "}
        <Link href="/tos" className="underline hover:text-navy">
          termini di servizio
        </Link>{" "}
        e prendi visione dell&apos;{" "}
        <Link href="/privacy" className="underline hover:text-navy">
          informativa privacy
        </Link>
        . Il consenso al trattamento per il servizio (necessario) e quello alla
        ricerca (opzionale) ti vengono chiesti subito dopo.
      </p>
    </PageShell>
  );
}
