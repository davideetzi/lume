import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  return session;
}

/**
 * Garantisce sessione + consenso al servizio attivo (non revocato).
 * Redirige a /signin o /consent se manca uno dei due.
 */
export async function requireConsent() {
  const session = await requireUser();
  const userId = session.user.id;
  const consent = await prisma.consentRecord.findFirst({
    where: {
      userId,
      revokedAt: null,
      serviceConsent: true,
    },
    orderBy: { signedAt: "desc" },
  });
  if (!consent) {
    redirect("/consent");
  }
  return { session, consent };
}
