/**
 * Versione corrente del consenso. Ogni cambio sostanziale richiede:
 *  1. aggiornare NEXT_PUBLIC_CONSENT_VERSION in .env (e .env.example)
 *  2. comunicare in copy che il consenso e stato aggiornato
 *  3. l'utente esistente con consenso revocato o vecchio dovra ri-firmare
 */
export function currentConsentVersion(): string {
  const v = process.env.NEXT_PUBLIC_CONSENT_VERSION;
  if (!v) {
    throw new Error(
      "NEXT_PUBLIC_CONSENT_VERSION non impostata. Vedi .env.example.",
    );
  }
  return v;
}
