// Hand-drawn flat SVG icons in the Duolingo style (sidebar, top bar, quests, path).
type P = { size?: number };

export function HouseIcon({ size = 32 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect x="7" y="13" width="18" height="16" rx="3" fill="#ffc800" />
      <path d="M4 15 16 5l12 10" fill="#ff4b4b" stroke="#ff4b4b" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="16" cy="20" r="4" fill="#ff9600" />
      <circle cx="16" cy="20" r="1.6" fill="#ff4b4b" />
    </svg>
  );
}

export function ShieldIcon({ size = 32 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M5 6q11-4 22 0v10q0 9-11 13Q5 25 5 16z" fill="#ffc800" />
      <path d="M27 9 9 27q3 1.5 7 2 11-4 11-13z" fill="#ffde00" opacity="0.7" />
    </svg>
  );
}

// Treasure chest: gold when reached, grey with a keyhole when locked
export function ChestIcon({ size = 32, locked = false }: P & { locked?: boolean }) {
  const body = locked ? "color-mix(in srgb, var(--line) 80%, white)" : "#ffc800";
  const band = locked ? "color-mix(in srgb, var(--line) 70%, black)" : "#cd7900";
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 40 34">
      <rect x="3" y="12" width="34" height="20" rx="3" fill={body} />
      <path d="M3 13q0-10 17-10t17 10z" fill={body} style={{ filter: "brightness(1.1)" }} />
      <rect x="3" y="12" width="34" height="4" fill={band} />
      <rect x="8" y="3.5" width="4" height="28.5" fill={band} opacity="0.6" />
      <rect x="28" y="3.5" width="4" height="28.5" fill={band} opacity="0.6" />
      <rect x="16" y="13" width="8" height="10" rx="2" fill={locked ? band : "#ff4b4b"} />
      <circle cx="20" cy="17" r="1.6" fill={locked ? body : "#ffc800"} />
    </svg>
  );
}

export function ShopIcon({ size = 32 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect x="5" y="12" width="22" height="17" rx="2" fill="#e5e5e5" />
      <rect x="8" y="17" width="8" height="6" rx="1.5" fill="#1cb0f6" />
      <rect x="18" y="17" width="6" height="12" rx="1" fill="#afafaf" />
      <path d="M3 5h26v6a3.25 3.25 0 0 1-6.5 0 3.25 3.25 0 0 1-6.5 0 3.25 3.25 0 0 1-6.5 0A3.25 3.25 0 0 1 3 11z" fill="#ff4b4b" />
      <path d="M9.5 5v6a3.25 3.25 0 0 0 6.5 0V5zm13 0v6" fill="#fff" opacity="0.85" />
    </svg>
  );
}

export function FlameIcon({ size = 28, active = true }: P & { active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 2c1 4 7 6 7 13a7 7 0 0 1-14 0c0-3 1.5-5 3.5-6.5 0 2 1 3.5 2.5 3.5C11 9 10.5 5 12 2z"
        fill={active ? "#ff9600" : "var(--line)"} />
      {/* inner flame: yellow when the streak is alive, a cut-out when it's 0 */}
      <path d="M12 12c2 2 3 3 3 5a3 3 0 0 1-6 0c0-2 1.5-3 3-5z" fill={active ? "#ffc800" : "var(--bg)"} />
    </svg>
  );
}

export function GemIcon({ size = 28 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 2 20.5 7v10L12 22l-8.5-5V7z" fill="#1cb0f6" stroke="#1cb0f6" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 12 20.5 7v10L12 22z" fill="#1899d6" />
      <path d="M6.5 8.5v5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function HeartIcon({ size = 28 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 21C5 16 2 12.5 2 8.5A5 5 0 0 1 12 6a5 5 0 0 1 10 2.5c0 4-3 7.5-10 12.5z" fill="#ff4b4b" />
      <ellipse cx="7.5" cy="8.5" rx="3" ry="2" fill="#ff8b8b" transform="rotate(-25 7.5 8.5)" />
    </svg>
  );
}

// Spanish flag (flag emojis don't render on Windows)
export function FlagIcon({ width = 40 }: { width?: number }) {
  return (
    <svg width={width} height={width * 0.75} viewBox="0 0 40 30" aria-label="Spanish">
      <rect width="40" height="30" rx="6" fill="#ff4b4b" />
      <rect y="8" width="40" height="14" fill="#ffc800" />
      <rect x="7" y="10.5" width="6" height="9" rx="1.5" fill="#ff4b4b" />
      <rect x="8.75" y="13" width="2.5" height="4" rx="0.8" fill="#ffc800" />
    </svg>
  );
}

export function BoltIcon({ size = 24, color = "#ffc800" }: P & { color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M14 2 4 14h7l-2 8 11-13h-7z" fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 2 9.5 9" stroke="#fff" strokeWidth="1.2" opacity="0.6" />
    </svg>
  );
}

export function LockIcon({ size = 40 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M10 14v-4a6 6 0 0 1 12 0v4" stroke="#e5e5e5" strokeWidth="3.5" fill="none" />
      <rect x="6" y="13" width="20" height="16" rx="3" fill="#e5e5e5" />
      <circle cx="16" cy="20" r="2" fill="#afafaf" />
      <rect x="15" y="20" width="2" height="5" rx="1" fill="#afafaf" />
    </svg>
  );
}

export function SearchIcon({ size = 40 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M11 21 4 28" stroke="#ff9600" strokeWidth="4" strokeLinecap="round" />
      <circle cx="18" cy="14" r="10" fill="#ddf4ff" stroke="#84d8ff" strokeWidth="3" />
      <path d="M13 12a5 5 0 0 1 5-4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function EnvelopeIcon({ size = 40 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect x="3" y="11" width="26" height="18" rx="3" fill="#ffc800" />
      <path d="M3 13l13 9 13-9" stroke="#e5a000" strokeWidth="2" fill="none" />
      <circle cx="16" cy="9" r="7" fill="#58cc02" />
      <circle cx="13.5" cy="8" r="2" fill="#fff" />
      <circle cx="18.5" cy="8" r="2" fill="#fff" />
      <circle cx="13.5" cy="8" r="1" fill="#4b4b4b" />
      <circle cx="18.5" cy="8" r="1" fill="#4b4b4b" />
    </svg>
  );
}

// Empty profile picture: dashed head-and-shoulders outline with a "+"
export function AvatarPlaceholder({ height = 230 }: { height?: number }) {
  return (
    <svg height={height} viewBox="0 0 200 230" aria-label="Add a profile picture">
      <circle cx="100" cy="88" r="62" fill="#84d8ff" />
      <path d="M28 230q8-72 72-72t72 72z" fill="#84d8ff" />
      <circle cx="100" cy="88" r="70" fill="none" stroke="#1cb0f6" strokeWidth="5" strokeDasharray="16 10" />
      <path d="M100 74v32M84 90h32" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
