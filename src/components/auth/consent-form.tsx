"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  recordConsentAction,
  type ConsentActionState,
} from "@/server/actions/consent";

const initialState: ConsentActionState = { ok: false };

export function ConsentForm({ consentVersion }: { consentVersion: string }) {
  const [state, formAction] = useActionState(
    recordConsentAction,
    initialState,
  );
  const [serviceConsent, setServiceConsent] = useState(false);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <fieldset className="space-y-4 rounded-lg border border-border bg-surface-soft p-6">
        <legend className="text-sm font-medium text-navy">
          Versione consenso {consentVersion}
        </legend>

        <CheckboxRow
          name="serviceConsent"
          required
          checked={serviceConsent}
          onChange={(v) => setServiceConsent(v)}
          label="Acconsento al trattamento dei miei dati per l'erogazione del servizio Lume."
          hint="Necessario. Senza questo consenso non possiamo salvare le tue risposte né calcolare il tuo profilo."
        />

        <CheckboxRow
          name="researchConsent"
          label="Acconsento alla cessione anonimizzata dei miei dati per fini di ricerca scientifica."
          hint="Opzionale e revocabile in qualsiasi momento dalle impostazioni del tuo account. La anonimizzazione è non reversibile."
        />
      </fieldset>

      {state.formError && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {state.formError}
        </p>
      )}

      <SubmitButton disabled={!serviceConsent} />
    </form>
  );
}

type CheckboxRowProps = {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  checked?: boolean;
  onChange?: (v: boolean) => void;
};

function CheckboxRow({
  name,
  label,
  hint,
  required,
  checked,
  onChange,
}: CheckboxRowProps) {
  const id = `consent-${name}`;
  const hintId = `${id}-hint`;
  return (
    <div className="flex gap-3">
      <input
        id={id}
        name={name}
        type="checkbox"
        required={required}
        checked={checked}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
        className="mt-1 h-4 w-4 rounded border-border text-teal accent-teal focus:ring-teal"
        aria-describedby={hint ? hintId : undefined}
      />
      <div>
        <label htmlFor={id} className="text-sm text-navy">
          {label}
          {required && (
            <span className="ml-1 text-red-700" aria-label="obbligatorio">
              *
            </span>
          )}
        </label>
        {hint && (
          <p id={hintId} className="mt-1 text-xs text-foreground-muted">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-md bg-navy px-6 py-3 text-base font-medium text-white hover:bg-navy-soft disabled:opacity-60"
    >
      {pending ? "Sto salvando..." : "Procedi"}
    </button>
  );
}
