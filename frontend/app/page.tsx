"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Course, Skill, Unit } from "@/lib/types";
import Mascot from "@/components/Mascot";
import { useUser } from "@/components/Layout";
import { ChestIcon } from "@/components/Icons";

const OFFSETS = [0, -45, -70, -45, 0, 45, 70, 45]; // zig-zag pattern of the path

export default function LearnPage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    api<Course>("/course").then(setCourse).catch(() => setError("Could not reach the server. Is the backend running?"));
  }, []);

  if (error) return <p className="py-10 text-center text-red">{error}</p>;
  if (!course) return <p className="py-10 text-center text-muted">Loading...</p>;

  return (
    <div onClick={() => setOpenId(null)}>
      {course.units.map((unit, u) => (
        <section key={unit.id} className="relative mb-16">
          <UnitHeader unit={unit} />
          <div className={`pointer-events-none absolute top-56 hidden sm:block ${u % 2 ? "left-4" : "right-4"}`}>
            <Mascot size={130} />
          </div>
          <div className="flex flex-col items-center gap-12 pt-8">
            {unit.skills.map((skill, i) => (
              <div key={skill.id} className="flex flex-col items-center gap-12">
                <SkillNode skill={skill} color={unit.color}
                  offset={OFFSETS[(i * 2) % OFFSETS.length] * (u % 2 ? -1 : 1)}
                  open={openId === skill.id}
                  onToggle={() => setOpenId(openId === skill.id ? null : skill.id)} />
                {/* treasure chest after the 2nd skill of each unit, just like the real path */}
                {i === 1 && <Chest open={skill.status === "completed"} offset={OFFSETS[3] * (u % 2 ? -1 : 1)} />}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function UnitHeader({ unit }: { unit: Unit }) {
  const { toast } = useUser();
  const shade = `color-mix(in srgb, ${unit.color} 80%, black)`;
  return (
    <div className="sticky top-[72px] z-20 mb-8 flex items-center justify-between gap-3 rounded-2xl px-4 py-4 text-white lg:top-4"
      style={{ background: unit.color }}>
      <div>
        <p className="font-extrabold uppercase opacity-80">← Section 1, Unit {unit.position}</p>
        <h2 className="text-xl font-extrabold">{unit.title}</h2>
      </div>
      <button onClick={() => toast(`📒 ${unit.description} — guidebook coming soon`)}
        className="btn flex items-center gap-2 border-2 bg-transparent px-4 text-white"
        style={{ borderColor: shade, boxShadow: `0 4px 0 ${shade}` }}>
        📒 <span className="hidden sm:inline">Guidebook</span>
      </button>
    </div>
  );
}

function Star({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="36" height="36">
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
        fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function Chest({ open, offset }: { open: boolean; offset: number }) {
  return (
    <div aria-label="Treasure chest" style={{ transform: `translateX(${offset}px)` }}>
      <ChestIcon size={84} locked={!open} />
    </div>
  );
}

interface NodeProps {
  skill: Skill;
  color: string;
  offset: number; // horizontal shift that makes the zig-zag path
  open: boolean;
  onToggle: () => void;
}

function SkillNode({ skill, color, offset, open, onToggle }: NodeProps) {
  const locked = skill.status === "locked";
  const current = skill.status === "available";
  const completed = skill.status === "completed";
  const bg = locked ? "var(--line)" : skill.legendary ? "#ffc800" : color;
  const progress = skill.lessons_completed / skill.total_lessons;

  return (
    <div className="relative flex flex-col items-center" style={{ transform: `translateX(${offset}px)`, zIndex: open ? 30 : undefined }}>
      {current && (
        <div className="animate-bob absolute -top-9 left-1/2 z-[2] -translate-x-1/2 rounded-xl border-2 border-line bg-bg px-3 py-2 font-extrabold uppercase"
          style={{ color }}>
          Start
          <span className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-line bg-bg" />
        </div>
      )}

      <div className="relative flex h-[100px] w-[100px] items-center justify-center">
        {/* progress ring around the current skill */}
        {current && (
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--line)" strokeWidth="8" />
            <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${progress * 283} 283`} />
          </svg>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="relative flex h-[62px] w-[70px] items-center justify-center rounded-[50%] transition-transform active:translate-y-2 active:!shadow-none"
          style={{ background: bg, boxShadow: `0 8px 0 color-mix(in srgb, ${bg} 75%, black)` }}
          aria-label={skill.title}
        >
          {skill.legendary ? <span className="text-3xl">🏆</span>
            : completed ? <span className="text-3xl font-black text-white">✓</span>
            : <Star color={locked ? "color-mix(in srgb, var(--line) 70%, black)" : "#fff"} />}
        </button>
        {skill.lessons_completed > 0 && (
          <span className="absolute bottom-1 right-0 rounded-full border-2 border-line bg-bg px-1.5 text-xs font-extrabold text-orange">
            👑{skill.lessons_completed}
          </span>
        )}
      </div>

      {/* popover shown when a node is clicked */}
      {open && (
        <div onClick={(e) => e.stopPropagation()}
          className={`animate-pop absolute top-[104px] z-20 w-72 rounded-2xl p-4 ${locked ? "border-2 border-line bg-soft text-muted" : "text-white"}`}
          style={locked ? {} : { background: color }}>
          <h3 className="text-lg font-extrabold">{skill.title}</h3>
          {locked ? (
            <p className="mt-1 font-bold">Complete all levels above to unlock this!</p>
          ) : (
            <>
              <p className="mb-3 font-bold opacity-90">
                {completed ? "Level complete! Practice or go Legendary." : `Lesson ${skill.lessons_completed + 1} of ${skill.total_lessons}`}
              </p>
              <Link href={`/lesson/${skill.id}${completed ? "?mode=practice" : ""}`}
                className="btn block bg-white text-center" style={{ color, boxShadow: "0 4px 0 #e5e5e5" }}>
                {completed ? "Practice +15 XP" : "Start +15 XP"}
              </Link>
              {completed && (
                <Link href={`/lesson/${skill.id}?mode=legendary`}
                  className="btn mt-3 block text-center text-[#7a5800]" style={{ background: "#ffc800", boxShadow: "0 4px 0 #e5a800" }}>
                  🏆 Legendary +40 XP
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
