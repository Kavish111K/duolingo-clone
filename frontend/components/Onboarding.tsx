"use client";
import { useState } from "react";
import Mascot from "./Mascot";

export const LEVELS = [
  "I’m new to Spanish",
  "I know some common words",
  "I can have basic conversations",
  "I can talk about various topics",
  "I can discuss most topics in detail",
];

// Signal-strength style bars: `filled` of the 4 bars are dark blue
function LevelBars({ filled }: { filled: number }) {
  return (
    <svg width="38" height="28" viewBox="0 0 38 28">
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={i * 10} y={20 - i * 5} width="7" height={8 + i * 5} rx="2.5"
          fill={i < filled ? "#1899d6" : "#cdeefd"} />
      ))}
    </svg>
  );
}

// "How much Spanish do you know?" question shown to a learner who hasn't answered it yet
export default function Onboarding({ onSubmit, onClose }: { onSubmit: (level: number) => void; onClose: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <button onClick={onClose} aria-label="Close" className="absolute left-6 top-5 text-3xl font-bold text-muted">✕</button>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 overflow-y-auto px-4 pb-8 pt-20">
        <div className="flex items-center gap-4">
          <Mascot size={110} />
          <div className="relative rounded-2xl border-2 border-line px-5 py-4 text-xl">
            <span className="absolute -left-[9px] top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-line bg-bg" />
            How much Spanish do you know?
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:ml-[30%]">
          {LEVELS.map((label, i) => (
            <button key={label} onClick={() => setSelected(i)}
              className={`tile flex items-center gap-5 px-6 py-4 text-left text-lg font-extrabold ${selected === i ? "selected" : ""}`}>
              <LevelBars filled={i} />
              {label}
            </button>
          ))}
        </div>
      </main>

      <footer className="border-t-2 border-line">
        <div className="mx-auto flex max-w-5xl justify-end px-4 py-8">
          <button className="btn btn-green w-full sm:w-48" disabled={selected === null}
            onClick={() => selected !== null && onSubmit(selected)}>
            Continue
          </button>
        </div>
      </footer>
    </div>
  );
}
