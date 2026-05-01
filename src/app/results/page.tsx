import { PageShell } from "@/components/ui/page-shell";
import { requireConsent } from "@/lib/auth-guards";

export const metadata = { title: "Le tue restituzioni" };

export default async function ResultsIndexPage() {
  await requireConsent();
  return (
    <PageShell
      title="Le tue restituzioni"
      intro="Le sessioni completate compaiono qui. Ognuna è un ritratto possibile, fatto in un certo momento. Puoi ripeterne nel tempo."
    >
      <div className="rounded-lg border border-border bg-surface-soft p-8 text-foreground-muted">
        Lista restituzioni, in arrivo dalla sessione 8 (rendering profilo +
        ICL). Per la singola restituzione: <code>/results/[sessionId]</code>.
      </div>
    </PageShell>
  );
}
