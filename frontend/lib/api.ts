const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function api<T>(path: string, method = "GET", body?: object): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Something went wrong");
  }
  return res.json();
}

// ---------- learner preferences (saved in the browser) ----------
export type Pref = "sound" | "animations" | "motivational" | "listening";

export function getPref(name: Pref): boolean {
  try { return localStorage.getItem("pref_" + name) !== "off"; } catch { return true; }
}

export function setPref(name: Pref, on: boolean) {
  try { localStorage.setItem("pref_" + name, on ? "on" : "off"); } catch {}
  if (name === "animations") document.documentElement.classList.toggle("no-anim", !on);
}

export type Theme = "system" | "light" | "dark";

export function setTheme(theme: Theme) {
  try { localStorage.setItem("theme", theme); } catch {}
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

// Short "ding" / "buzz" made with the Web Audio API, so no sound files are needed
export function playSound(correct: boolean) {
  if (typeof window === "undefined" || !getPref("sound")) return;
  const ctx = new AudioContext();
  const notes = correct ? [660, 880] : [220, 180];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = correct ? "sine" : "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.15);
  });
}

// Text-to-speech for Spanish words using the browser's built-in voices
export function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis || !getPref("listening")) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "es-ES";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Lenient answer comparison: ignore case, punctuation and extra spaces
export function normalize(text: string): string {
  return text.toLowerCase().replace(/[¿?¡!.,]/g, "").replace(/\s+/g, " ").trim();
}
