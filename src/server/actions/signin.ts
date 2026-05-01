"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { signinSchema } from "@/lib/auth-schemas";
import { prisma } from "@/lib/db";

export type SigninActionState = {
  ok: boolean;
  fieldErrors?: Record<string, string[] | undefined>;
  formError?: string;
};

export async function signinAction(
  _prev: SigninActionState | undefined,
  formData: FormData,
): Promise<SigninActionState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = signinSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const email = parsed.data.email.toLowerCase().trim();

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return {
        ok: false,
        formError: "Email o password non validi.",
      };
    }
    throw e;
  }

  // Decisione di routing post-login: se manca il consenso, vai al consenso.
  // Se il consenso al servizio e attivo, vai alla sessione (assessment).
  const user = await prisma.user.findUnique({ where: { email } });
  const lastConsent = user
    ? await prisma.consentRecord.findFirst({
        where: { userId: user.id, revokedAt: null, serviceConsent: true },
        orderBy: { signedAt: "desc" },
      })
    : null;

  redirect(lastConsent ? "/assessment" : "/consent");
}
