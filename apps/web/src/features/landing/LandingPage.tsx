import { HeroSection } from './HeroSection';
import { StorySections } from './StorySections';

/** Cinematic landing (light) — Karthik's Tenrec template adapted to Tract. */
export function CinematicLanding() {
  return (
    <div className="landing-scope min-h-full bg-ground">
      <HeroSection />
      <StorySections />
    </div>
  );
}
