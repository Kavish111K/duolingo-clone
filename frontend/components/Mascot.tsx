// Simple hand-made green owl mascot (SVG). "sad" mode is used for the out-of-hearts popup.
export default function Mascot({ size = 120, sad = false }: { size?: number; sad?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <ellipse cx="50" cy="94" rx="26" ry="4" fill="#000" opacity="0.08" />
      <path d="M22 30 L30 12 L40 26 Z M78 30 L70 12 L60 26 Z" fill="#58a700" />
      <ellipse cx="50" cy="56" rx="32" ry="36" fill="#58cc02" />
      <ellipse cx="50" cy="68" rx="20" ry="20" fill="#89e219" />
      <ellipse cx="18" cy="60" rx="7" ry="16" fill="#58a700" />
      <ellipse cx="82" cy="60" rx="7" ry="16" fill="#58a700" />
      <circle cx="37" cy="42" r="12" fill="#fff" />
      <circle cx="63" cy="42" r="12" fill="#fff" />
      <circle cx={sad ? 37 : 39} cy={sad ? 46 : 42} r="6" fill="#4b4b4b" />
      <circle cx={sad ? 63 : 61} cy={sad ? 46 : 42} r="6" fill="#4b4b4b" />
      {sad && <path d="M26 36 L46 30 M74 36 L54 30" stroke="#58a700" strokeWidth="4" strokeLinecap="round" />}
      <path d="M44 52 L56 52 L50 61 Z" fill="#ff9600" />
      <path d="M38 90 l4 -6 l4 6 M54 90 l4 -6 l4 6" stroke="#ff9600" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <Mascot size={140} />
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="max-w-sm text-lg text-muted">{text}</p>
      <span className="rounded-xl bg-gold px-4 py-1 font-extrabold uppercase text-white">Coming soon</span>
    </div>
  );
}
