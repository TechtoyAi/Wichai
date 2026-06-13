/**
 * Client-side scoring helpers (mirror server logic for instant feedback).
 * Server (GAS) remains source of truth — these are UX-only.
 */

export async function hashChoice(qId, choice) {
  const buf = new TextEncoder().encode(qId + choice);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function checkAnswer(qId, choice, expectedHash) {
  const h = await hashChoice(qId, choice);
  return h === expectedHash;
}

export function isCritical(elapsedSec, secPerQuestion) {
  return elapsedSec <= Math.ceil(secPerQuestion / 3);
}
