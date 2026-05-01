"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  signupAction,
  type SignupActionState,
} from "@/server/actions/signup";

const initialState: SignupActionState = { ok: false };

export function SignupForm() {
  const [state, formAction] = useActionState(signupAction, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        errors={state.fieldErrors?.email}
      />
      <Field
        label="Nome (facoltativo)"
        name="name"
        type="text"
        autoComplete="given-name"
        errors={state.fieldErrors?.name}
        hint="Compare nei messaggi che ti scriviamo. Puoi omettere."
      />
      <Field
        label="Anno di nascita"
        name="birthYear"
        type="number"
        inputMode="numeric"
        min={1900}
        max={new Date().getFullYear()}
        required
        errors={state.fieldErrors?.birthYear}
        hint="Lume è riservato a persone maggiorenni."
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        errors={state.fieldErrors?.password}
        hint="Almeno 8 caratteri."
      />
      <Field
        label="Conferma password"
        name="passwordConfirm"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        errors={state.fieldErrors?.passwordConfirm}
      />
      {state.formError && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {state.formError}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
};

function Field({ label, name, errors, hint, ...rest }: FieldProps) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const hasErrors = !!errors?.length;
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-navy"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={hasErrors || undefined}
        aria-describedby={
          [hint ? hintId : null, hasErrors ? errorId : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-foreground outline-none focus:border-teal focus:ring-1 focus:ring-teal aria-[invalid=true]:border-red-400"
        {...rest}
      />
      {hint && !hasErrors && (
        <p id={hintId} className="mt-1 text-xs text-foreground-muted">
          {hint}
        </p>
      )}
      {hasErrors && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-700">
          {errors!.join(" · ")}
        </p>
      )}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-navy px-6 py-3 text-base font-medium text-white hover:bg-navy-soft disabled:opacity-60"
    >
      {pending ? "Sto creando il tuo accesso..." : "Crea il tuo accesso"}
    </button>
  );
}
