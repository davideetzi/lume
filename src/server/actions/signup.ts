"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { signupSchema } from "@/lib/auth-schemas";
import { signIn } from "@/auth";

export type SignupActionState = {
  ok: boolean;
  fieldErrors?: Record<string, string[] | undefined>;
  formError?: string;
};

export async function signupAction(
  _prev: SignupActionState | undefined,
  formData: FormData,
): Promise<SignupActionState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
    birthYear: String(formData.get("birthYear") ?? ""),
    name: String(formData.get("name") ?? ""),
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const emailNormalized = data.email.toLowerCase().trim();

  try {
    const passwordHash = await bcrypt.hash(data.password, 12);
    await prisma.user.create({
      data: {
        email: emailNormalized,
        passwordHash,
        name: data.name ?? null,
        birthYear: data.birthYear,
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        ok: false,
        fieldErrors: {
          email: ["Esiste già un account con questa email"],
        },
      };
    }
    return {
      ok: false,
      formError:
        "Qualcosa è andato storto. Riprova tra un momento, oppure scrivici.",
    };
  }

  // login automatico via credentials provider, poi redirect al consenso
  await signIn("credentials", {
    email: emailNormalized,
    password: data.password,
    redirect: false,
  });

  redirect("/consent");
}
