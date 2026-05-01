"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  signinAction,
  type SigninActionState,
} from "@/server/actions/signin";

const initialState: SigninActionState = { ok: false };

export function SigninForm() {
  const [state, formAction] = useActionState(signinAction, initialState);
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
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        errors={state.fieldErrors?.password}
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
};

function Field({ label, name, errors, ...rest }: FieldProps) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  const hasErrors = !!errors?.length;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-navy">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={hasErrors || undefined}
        aria-describedby={hasErrors ? errorId : undefined}
        className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-foreground outline-none focus:border-teal focus:ring-1 focus:ring-teal aria-[invalid=true]:border-red-400"
        {...rest}
      />
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
      {pending ? "Accesso..." : "Accedi"}
    </button>
  );
}
