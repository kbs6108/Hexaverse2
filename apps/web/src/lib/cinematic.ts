/**
 * Cinematic Fullscreen & Entry State Management
 */

let pendingCinematic = false;

export function triggerCitizenCinematic(): void {
  pendingCinematic = true;
}

export function consumeCitizenCinematic(): boolean {
  if (pendingCinematic) {
    pendingCinematic = false;
    return true;
  }
  return false;
}

export function clearCitizenCinematic(): void {
  pendingCinematic = false;
}

export { useCinematicTransition, CinematicLetterbox } from '@/components/ui/CinematicLetterbox';
export type { LetterboxPhase } from '@/components/ui/CinematicLetterbox';
