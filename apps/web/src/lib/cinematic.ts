/**
 * Cinematic Entry State Management
 * 
 * Ensures the cinematic letterbox transition into CitizenHome runs
 * strictly ONCE following a successful authentication session with fullscreen,
 * and NEVER on subsequent internal navigations (e.g. Citizen <-> Map),
 * tab clicks, or page refreshes.
 */

let pendingCinematic = false;

/**
 * Triggers the one-time cinematic entry flag upon successful authentication.
 */
export function triggerCitizenCinematic(): void {
  pendingCinematic = true;
}

/**
 * Checks and immediately consumes the cinematic flag.
 * Returns true ONLY on initial mount following an auth success.
 * Subsequent calls return false.
 */
export function consumeCitizenCinematic(): boolean {
  if (pendingCinematic) {
    pendingCinematic = false;
    return true;
  }
  return false;
}

/**
 * Explicitly clears the cinematic flag (e.g. on logout).
 */
export function clearCitizenCinematic(): void {
  pendingCinematic = false;
}
