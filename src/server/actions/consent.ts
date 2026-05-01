"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { currentConsentVersion } from "@/lib/consent/version";

export type ConsentActionState = {
  ok: boolean;
  formError?: string;
};

export async function recordConsentAction(
  _prev: ConsentActionState | undefined,
  formData: FormData,
): Promise<ConsentActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const serviceConsent = formData.get("serviceConsent") === "on";
  const researchConsent = formData.get("researchConsent") === "on";

  if (!serviceConsent) {
    return {
      ok: false,
      formError:
        "Per usare Lume devi acconsentire al trattamento necessario all'erogazione del servizio.",
    };
  }

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null;
  const ipHash = ip ? sha256(ip) : null;
  const userAgent = hdrs.get("user-agent") ?? null;

  await prisma.consentRecord.create({
    data: {
      userId: session.user.id,
      consentVersion: currentConsentVersion(),
      serviceConsent: true,
      researchConsent,
      ipHash,
      userAgent,
    },
  });

  redirect("/onboarding");
}

export async function revokeResearchConsentAction(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  // Strategia: marca tutti i ConsentRecord attivi come revocati e crea un
  // nuovo record con researchConsent=false. Cosi resta l'audit trail.
  const userId = session.user!.id;
  await prisma.$transaction([
    prisma.consentRecord.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.consentRecord.create({
      data: {
        userId,
        consentVersion: currentConsentVersion(),
        serviceConsent: true,
        researchConsent: false,
      },
    }),
  ]);
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}
