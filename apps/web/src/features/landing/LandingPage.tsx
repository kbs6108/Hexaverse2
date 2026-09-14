import { HeroSection } from './HeroSection';
import { StorySections } from './StorySections';

/** Cinematic landing (light) — Karthik's Tenrec template adapted to Land Stack. */
export function CinematicLanding() {
  return (
    <div className="min-h-full bg-[#f5f5f7]">
      <HeroSection />
      <StorySections />
    </div>
  );
}
