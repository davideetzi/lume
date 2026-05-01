import { redirect } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";
import { ConsentForm } from "@/components/auth/consent-form";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { currentConsentVersion } from "@/lib/consent/version";

export const metadata = { title: "Consenso informato" };

export default async function ConsentPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const version = currentConsentVersion();
  const existing = await prisma.consentRecord.findFirst({
    where: {
      userId: session.user!.id,
      consentVersion: version,
      revokedAt: null,
      serviceConsent: true,
    },
    orderBy: { signedAt: "desc" },
  });

  if (existing) {
    redirect("/onboarding");
  }

  return (
    <PageShell
      title="Consenso informato"
      intro="Ti chiediamo due cose distinte. Il consenso al trattamento per l'erogazione del servizio è necessario. Il consenso alla cessione anonimizzata per fini di ricerca è opzionale e revocabile in qualsiasi momento dal tuo account."
    >
      <div className="space-y-8">
        <div className="space-y-3 text-foreground-muted">
          <p>
            Lume è uno strumento di autoesplorazione orientativa. Non è un test
            del QI, non è uno strumento diagnostico, non sostituisce
            valutazioni cliniche professionali. L&apos;Indice Cognitivo
            Composito Lume è uno score interno al campione, non un QI normato.
          </p>
          <p>
            Per i dettagli sulle finalità e sui dati trattati, leggi la{" "}
            <Link
              href="/consent-info"
              className="underline hover:text-navy"
              target="_blank"
            >
              pagina informativa
            </Link>{" "}
            e l&apos;{" "}
            <Link
              href="/privacy"
              className="underline hover:text-navy"
              target="_blank"
            >
              informativa privacy
            </Link>
            .
          </p>
        </div>

        <ConsentForm consentVersion={version} />
      </div>
    </PageShell>
  );
}
