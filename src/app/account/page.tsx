import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { signOut } from "@/auth";
import { revokeResearchConsentAction } from "@/server/actions/consent";

export const metadata = { title: "Il tuo account" };

export default async function AccountPage() {
  const session = await requireUser();
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, birthYear: true, createdAt: true },
  });

  const lastConsent = await prisma.consentRecord.findFirst({
    where: { userId, revokedAt: null },
    orderBy: { signedAt: "desc" },
    select: {
      consentVersion: true,
      serviceConsent: true,
      researchConsent: true,
      signedAt: true,
    },
  });

  return (
    <PageShell
      title="Il tuo account"
      intro="Le tue informazioni e i tuoi consensi. Puoi revocare il consenso alla ricerca in ogni momento."
    >
      <div className="space-y-10">
        <section className="rounded-lg border border-border bg-surface-soft p-6">
          <h2 className="text-lg font-semibold text-navy">Informazioni</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Row label="Email" value={user?.email ?? "—"} />
            <Row label="Nome" value={user?.name ?? "—"} />
            <Row
              label="Anno di nascita"
              value={user?.birthYear?.toString() ?? "—"}
            />
            <Row
              label="Account creato"
              value={
                user?.createdAt
                  ? user.createdAt.toLocaleDateString("it-IT")
                  : "—"
              }
            />
          </dl>
        </section>

        <section className="rounded-lg border border-border bg-surface-soft p-6">
          <h2 className="text-lg font-semibold text-navy">Consensi attivi</h2>
          {lastConsent ? (
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Row label="Versione" value={lastConsent.consentVersion} />
              <Row
                label="Firmato il"
                value={lastConsent.signedAt.toLocaleDateString("it-IT")}
              />
              <Row
                label="Servizio"
                value={lastConsent.serviceConsent ? "Attivo" : "Non attivo"}
              />
              <Row
                label="Ricerca"
                value={lastConsent.researchConsent ? "Attivo" : "Non attivo"}
              />
            </dl>
          ) : (
            <p className="mt-3 text-sm text-foreground-muted">
              Nessun consenso registrato.{" "}
              <Link href="/consent" className="underline hover:text-navy">
                Firma ora
              </Link>
              .
            </p>
          )}
          {lastConsent?.researchConsent && (
            <form
              action={revokeResearchConsentAction}
              className="mt-6 border-t border-border pt-4"
            >
              <p className="text-sm text-foreground-muted">
                Vuoi revocare il consenso alla ricerca? Le tue sessioni
                verranno escluse dal dataset analitico al primo aggiornamento
                successivo. Manterrai accesso al servizio.
              </p>
              <button
                type="submit"
                className="mt-3 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-navy hover:border-teal"
              >
                Revoca consenso ricerca
              </button>
            </form>
          )}
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-navy">Sessione</h2>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
            className="mt-4"
          >
            <button
              type="submit"
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-navy hover:border-teal"
            >
              Esci dall&apos;account
            </button>
          </form>
        </section>
      </div>
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-foreground-muted">
        {label}
      </dt>
      <dd className="mt-1 text-navy">{value}</dd>
    </div>
  );
}
