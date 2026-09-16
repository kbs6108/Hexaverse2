import { useEffect, useState } from 'react';

/** Verified real-world coordinates and place names from the three pilot regions. */
const TELEMETRY_DATA = [
  '16.443° N, 80.556° E · Mangalagiri, Guntur (166 parcels)',
  '12.954° N, 79.951° E · Sriperumbudur, Kancheepuram (238 parcels)',
  '17.249° N, 78.399° E · Shamshabad, Ranga Reddy (168 parcels)',
  '16.442° N, 80.555° E · Survey 123/4 · Mangalagiri (R)',
  '12.953° N, 79.951° E · Survey 45/2 · Sriperumbudur (R)',
  '17.250° N, 78.397° E · Survey 77 · Shamshabad (R)',
  '80.545° E, 16.434° N · Guntur District Pilot AOI',
  '79.940° E, 12.945° N · Kancheepuram Pilot AOI',
  '78.388° E, 17.240° N · Ranga Reddy Pilot AOI',
  '16.449° N, 80.567° E · GNT-02 Cadastral Frame',
  '12.958° N, 79.962° E · KPM-04 Cadastral Frame',
  '17.258° N, 78.410° E · RR-07 Cadastral Frame',
];

const DEFAULT_ENTRY = '16.443° N, 80.556° E · Mangalagiri, Guntur (166 parcels)';

interface SlotState {
  text: string;
  top: number; // percentage (22 to 74)
  right: number; // percentage (8 to 32)
  visible: boolean;
}

/**
 * Faint, borderless single lines of coordinates and place names that
 * randomly appear, linger, and fade away in the right half of the hero.
 * 
 * - No cards, no boxes, no lines, no background colors.
 * - Faint muted monospace typography (text-ink-3/45).
 * - Non-intrusive: pointer-events-none, strictly confined to the vacant right half.
 */
export function FaintTelemetry() {
  const [slots, setSlots] = useState<SlotState[]>([
    { text: TELEMETRY_DATA[0] ?? DEFAULT_ENTRY, top: 28, right: 18, visible: true },
    { text: TELEMETRY_DATA[1] ?? DEFAULT_ENTRY, top: 48, right: 12, visible: true },
    { text: TELEMETRY_DATA[2] ?? DEFAULT_ENTRY, top: 66, right: 24, visible: false },
  ]);

  useEffect(() => {
    // Independent interval cycles for each of the 3 slots so they never fade at the same time
    const intervals = [
      { id: 0, intervalMs: 6200, delayMs: 1000 },
      { id: 1, intervalMs: 7800, delayMs: 3400 },
      { id: 2, intervalMs: 9100, delayMs: 5800 },
    ];

    const timers: number[] = [];

    intervals.forEach(({ id, intervalMs, delayMs }) => {
      const startTimer = window.setTimeout(() => {
        const cycle = () => {
          // 1. Fade out
          setSlots((prev) =>
            prev.map((s, idx) => (idx === id ? { ...s, visible: false } : s))
          );

          // 2. After fade-out, pick new random text and new position, then fade in
          const swapTimer = window.setTimeout(() => {
            setSlots((prev) => {
              const currentTexts = prev.map((p) => p.text);
              const pool = TELEMETRY_DATA.filter((t) => !currentTexts.includes(t));
              const randomPick = pool[Math.floor(Math.random() * pool.length)];
              const newText: string = randomPick ?? DEFAULT_ENTRY;

              // Pick random position within safe vertical & horizontal bounds
              // Slot 0: upper third (22-38%)
              // Slot 1: middle third (42-56%)
              // Slot 2: lower third (60-74%)
              let newTop = 25;
              if (id === 0) newTop = 22 + Math.floor(Math.random() * 16);
              else if (id === 1) newTop = 42 + Math.floor(Math.random() * 15);
              else newTop = 60 + Math.floor(Math.random() * 14);

              const newRight = 8 + Math.floor(Math.random() * 22);

              return prev.map((s, idx) =>
                idx === id ? { text: newText, top: newTop, right: newRight, visible: true } : s
              );
            });
          }, 1400); // fade-out duration

          timers.push(swapTimer);
        };

        const intervalId = window.setInterval(cycle, intervalMs);
        timers.push(intervalId);
      }, delayMs);

      timers.push(startTimer);
    });

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 hidden overflow-hidden select-none lg:block"
      aria-hidden="true"
    >
      {slots.map((slot, idx) => (
        <div
          key={idx}
          className="absolute whitespace-nowrap font-mono text-[11px] tracking-wide text-ink-3 transition-all duration-[1400ms] ease-in-out"
          style={{
            top: `${slot.top}%`,
            right: `${slot.right}%`,
            opacity: slot.visible ? 0.42 : 0,
            transform: slot.visible ? 'translateY(0px)' : 'translateY(4px)',
          }}
        >
          {slot.text}
        </div>
      ))}
    </div>
  );
}
