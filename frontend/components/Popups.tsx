"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LessonResult } from "@/lib/types";
import Mascot from "./Mascot";

// ---------- toast: small message at the top that hides itself ----------
export function Toast({ message, onClose }: { message: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;
  return (
    <div className="animate-pop fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-2xl border-2 border-line bg-bg px-6 py-3 font-extrabold shadow-lg">
      {message}
    </div>
  );
}

// ---------- out of hearts popup ----------
export function OutOfHearts({ gems, onRefill, onPractice }: { gems: number; onRefill: () => void; onPractice: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="animate-pop flex w-full max-w-md flex-col items-center gap-4 rounded-2xl bg-bg p-8 text-center">
        <Mascot size={120} sad />
        <h2 className="text-2xl font-extrabold">You ran out of hearts!</h2>
        <p className="text-muted">Refill your hearts with gems, or practice a skill to earn a heart back.</p>
        <button className="btn btn-blue w-full" onClick={onRefill} disabled={gems < 350}>Refill for 💎350</button>
        <button className="btn btn-outline w-full" onClick={onPractice}>Practice to earn hearts</button>
        <Link href="/" className="font-extrabold uppercase text-muted">No thanks</Link>
      </div>
    </div>
  );
}

// ---------- legendary challenge failed ----------
export function TimeUp({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="animate-pop flex w-full max-w-md flex-col items-center gap-4 rounded-2xl bg-bg p-8 text-center">
        <Mascot size={120} sad />
        <h2 className="text-2xl font-extrabold">Time&apos;s up!</h2>
        <p className="text-muted">Legendary challenges must be finished before the clock runs out.</p>
        <button className="btn btn-green w-full" onClick={onRetry}>Try again</button>
        <Link href="/" className="font-extrabold uppercase text-muted">Quit</Link>
      </div>
    </div>
  );
}

// ---------- lesson complete screen with confetti ----------
const COLORS = ["#58cc02", "#1cb0f6", "#ff4b4b", "#ffc800", "#ce82ff", "#ff9600"];

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="w-28 rounded-2xl border-2 text-center" style={{ borderColor: color, background: color }}>
      <p className="py-1 text-xs font-extrabold uppercase text-white">{label}</p>
      <p className="rounded-xl bg-bg py-3 text-xl font-extrabold" style={{ color }}>{value}</p>
    </div>
  );
}

export function LessonComplete({ result, accuracy, legendary }: { result: LessonResult; accuracy: number; legendary: boolean }) {
  // coloured squares falling from the top
  const [confetti] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      left: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
    }))
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden p-6">
      {confetti.map((c, i) => (
        <span key={i} className="pointer-events-none fixed -top-4 h-3 w-2"
          style={{ left: `${c.left}%`, background: c.color, animation: `fall ${c.duration}s linear ${c.delay}s forwards` }} />
      ))}
      <div className="animate-pop"><Mascot size={180} /></div>
      <h1 className="text-center text-3xl font-extrabold text-gold">
        {legendary ? "Legendary!" : result.skill_completed ? "Skill complete!" : "Lesson complete!"}
      </h1>
      <div className="flex gap-4">
        <StatBox label="Total XP" value={`⚡${result.xp_earned}`} color="#ffc800" />
        <StatBox label="Accuracy" value={`🎯${accuracy}%`} color="#58cc02" />
        <StatBox label="Streak" value={`🔥${result.streak}`} color="#ff9600" />
      </div>
      <Link href="/" className="btn btn-green w-full max-w-sm text-center">Continue</Link>
    </div>
  );
}
