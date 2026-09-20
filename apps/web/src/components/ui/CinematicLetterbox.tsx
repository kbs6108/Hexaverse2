import { useEffect, useState } from 'react';

export type LetterboxPhase = 'idle' | 'hold' | 'retract' | 'settle';

export function useCinematicTransition() {
  const [phase, setPhase] = useState<LetterboxPhase>('idle');

  const trigger = () => {
    setPhase('hold');
    // Hold the black frame for 300ms
    const t1 = setTimeout(() => {
      setPhase('retract');
    }, 300);
    // After 2.1s retraction wipe (total 2400ms), finish
    const t2 = setTimeout(() => {
      setPhase('idle');
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  };

  return { phase, trigger };
}

export function CinematicLetterbox({ phase }: { phase: LetterboxPhase }) {
  if (phase === 'idle' || phase === 'settle') return null;

  const isRetracting = phase === 'retract';

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden">
      {/* Top 15vh black letterbox */}
      <div
        className={`fixed top-0 left-0 right-0 h-[15vh] bg-black ${
          isRetracting
            ? '-translate-y-full transition-transform duration-[2100ms] ease-[cubic-bezier(0.33,1,0.68,1)]'
            : 'translate-y-0'
        }`}
      />
      {/* Bottom 15vh black letterbox */}
      <div
        className={`fixed bottom-0 left-0 right-0 h-[15vh] bg-black ${
          isRetracting
            ? 'translate-y-full transition-transform duration-[2100ms] ease-[cubic-bezier(0.33,1,0.68,1)]'
            : 'translate-y-0'
        }`}
      />
    </div>
  );
}
