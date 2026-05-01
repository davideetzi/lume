import { z } from "zod";

const CURRENT_YEAR = new Date().getFullYear();

export const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, "L'email è obbligatoria")
      .email("Email non valida")
      .max(254),
    password: z
      .string()
      .min(8, "Almeno 8 caratteri")
      .max(72, "Massimo 72 caratteri"),
    passwordConfirm: z.string().min(1, "Conferma la password"),
    birthYear: z.coerce
      .number()
      .int()
      .min(CURRENT_YEAR - 120, "Anno di nascita non plausibile")
      .max(CURRENT_YEAR - 18, "Devi avere almeno 18 anni per usare Lume"),
    name: z
      .string()
      .max(80)
      .transform((v) => v.trim() || undefined)
      .optional(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Le password non coincidono",
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const signinSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(72),
});

export type SigninInput = z.infer<typeof signinSchema>;
