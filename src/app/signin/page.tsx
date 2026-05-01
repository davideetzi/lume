import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui/page-shell";
import { SigninForm } from "@/components/auth/signin-form";
import { auth } from "@/auth";

export const metadata = { title: "Accedi" };

export default async function SigninPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/assessment");
  }
  return (
    <PageShell
      title="Accedi"
      intro="Bentornato. Il tuo profilo Lume ti aspetta dove l'hai lasciato."
      maxWidth="sm"
    >
      <SigninForm />
      <p className="mt-8 text-sm text-foreground-muted">
        Non hai ancora un account?{" "}
        <Link href="/signup" className="underline hover:text-navy">
          Crealo qui
        </Link>
        .
      </p>
    </PageShell>
  );
}
