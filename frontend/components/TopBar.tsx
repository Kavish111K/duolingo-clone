"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Course, Me } from "@/lib/types";
import Mascot from "./Mascot";
import { FlagIcon, FlameBadge, FlameIcon, GemChestIcon, GemIcon, HeartIcon, LockIcon } from "./Icons";

type Menu = "courses" | "streak" | "gems" | "hearts" | null;
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const REFILL_COST = 350;

// Top bar: flag, streak, gems and hearts. Each one opens a popup on hover or click.
export default function TopBar({ me, refresh, toast }: { me: Me | null; refresh: () => void; toast: (m: string) => void }) {
  const path = usePathname();
  const [open, setOpen] = useState<Menu>(null);
  useEffect(() => setOpen(null), [path]); // close when the page changes
  if (!me) return <div className="h-10" />;

  // one item of the bar: the button plus its popup (the popup spans the whole bar, like Duolingo)
  const item = (name: Menu, button: React.ReactNode, popup: React.ReactNode, label: string) => (
    <div onMouseEnter={() => setOpen(name)} onMouseLeave={() => setOpen(null)}>
      <button onClick={() => setOpen(open === name ? null : name)} aria-label={label}
        className={`relative flex items-center gap-2 rounded-xl px-2 py-1.5 ${open === name ? "bg-soft" : "hover:bg-soft"}`}>
        {button}
        {open === name && <span className="absolute -bottom-[19px] left-1/2 z-50 h-4 w-4 -translate-x-1/2 rotate-45 border-l-2 border-t-2 border-line bg-bg" />}
      </button>
      {open === name && (
        <div className="absolute left-0 right-0 top-full z-40 pt-3">
          <div className="animate-pop overflow-hidden rounded-2xl border-2 border-line bg-bg text-base">{popup}</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative flex items-center justify-between gap-1 text-lg font-extrabold">
      {item("courses", <><FlagIcon width={40} /><span className="text-muted">1</span></>, <CoursesPopup toast={toast} />, "My courses")}
      {item("streak",
        <span className={`flex items-center gap-2 ${me.streak > 0 ? "text-orange" : "text-line"}`}><FlameIcon active={me.streak > 0} />{me.streak}</span>,
        <StreakPopup me={me} toast={toast} />, "Day streak")}
      {item("gems", <span className="flex items-center gap-2 text-blue"><GemIcon />{me.gems}</span>, <GemsPopup gems={me.gems} />, "Gems")}
      {item("hearts", <span className="flex items-center gap-2 text-red"><HeartIcon />{me.hearts}</span>,
        <HeartsPopup me={me} refresh={refresh} toast={toast} />, "Hearts")}
    </div>
  );
}

function CoursesPopup({ toast }: { toast: (m: string) => void }) {
  return (
    <>
      <p className="border-b-2 border-line px-5 py-3 text-sm uppercase text-muted">My courses</p>
      <div className="flex items-center gap-4 border-b-2 border-line bg-sel px-5 py-3 font-extrabold text-blue"><FlagIcon width={40} /> Spanish</div>
      <button className="flex w-full items-center gap-4 px-5 py-3 font-extrabold hover:bg-soft" onClick={() => toast("More languages are coming soon")}>
        <span className="flex h-[30px] w-10 items-center justify-center rounded-md border-2 border-line text-muted">+</span>
        Add a new course
      </button>
    </>
  );
}

function StreakPopup({ me, toast }: { me: Me; toast: (m: string) => void }) {
  const message = me.streak === 0 ? "Do a lesson today to start a new streak!"
    : me.streak >= me.longest_streak ? "You've earned your longest streak ever!"
    : `Keep it going! Your longest streak is ${me.longest_streak} days.`;
  const week = me.streak_week ?? Array(7).fill(false); // empty calendar if the server didn't send it

  return (
    <>
      <div className="bg-orange p-5 text-white">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-2xl font-extrabold">{me.streak} day streak</h3>
            <p className="mt-2 font-bold">{message}</p>
          </div>
          <FlameBadge size={80} />
        </div>
        {/* this week: a check on every day that is part of the streak */}
        <div className="mt-4 flex justify-between rounded-2xl bg-white px-3 py-3">
          {DAYS.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span className={`font-extrabold ${i === (me.today_index ?? -1) ? "text-orange" : "text-[#afafaf]"}`}>{d}</span>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm text-white ${week[i] ? "bg-orange" : "bg-[#e5e5e5]"}`}>
                {week[i] && "✓"}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-[#ff6b00] p-4 text-white">
          <Mascot size={70} />
          <div className="flex-1">
            <p className="font-extrabold">Friend Streaks</p>
            <p className="mb-2 text-sm font-bold">0 active Friend Streaks</p>
            <button className="btn w-full bg-white py-2 text-sm text-[#ff6b00]" style={{ boxShadow: "0 3px 0 #ffd0b0" }}
              onClick={() => toast("Friend Streaks are coming soon")}>View list</button>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border-2 border-line p-4">
          <span className="shrink-0">{me.streak >= 7 ? <span className="text-4xl">🏅</span> : <LockIcon size={48} />}</span>
          <div>
            <p className="font-extrabold">Streak Society</p>
            <p className="text-sm text-muted">
              {me.streak >= 7 ? "You're a member! Keep your streak going." : "Reach a 7 day streak to join the Streak Society and earn exclusive rewards."}
            </p>
          </div>
        </div>
        <Link href="/profile" className="btn btn-blue block text-center">View more</Link>
      </div>
    </>
  );
}

function GemsPopup({ gems }: { gems: number }) {
  return (
    <div className="flex items-center gap-4 p-5">
      <GemChestIcon size={100} />
      <div>
        <h3 className="text-2xl font-extrabold">Gems</h3>
        <p className="my-1 text-muted">You have {gems} gems</p>
        <Link href="/shop" className="font-extrabold uppercase text-blue">Go to shop</Link>
      </div>
    </div>
  );
}

function HeartsPopup({ me, refresh, toast }: { me: Me; refresh: () => void; toast: (m: string) => void }) {
  const router = useRouter();
  const full = me.hearts >= me.max_hearts;
  const mins = me.next_heart_minutes ?? 0;
  const wait = mins >= 60 ? `${Math.round(mins / 60)} hour${mins >= 90 ? "s" : ""}` : `${mins} minute${mins === 1 ? "" : "s"}`;

  const refill = async () => {
    try {
      await api("/hearts/refill", "POST");
      refresh();
      toast("❤️ Hearts refilled!");
    } catch (e) {
      toast((e as Error).message);
    }
  };

  // practice the first completed skill (practice doesn't cost hearts and earns one back)
  const practice = async () => {
    const course = await api<Course>("/course");
    const skill = course.units.flatMap((u) => u.skills).find((s) => s.status === "completed");
    if (skill) router.push(`/lesson/${skill.id}?mode=practice`);
    else toast("Complete a skill first to practice it");
  };

  const row = (icon: React.ReactNode, label: string, right: React.ReactNode, onClick: () => void, disabled = false) => (
    <button onClick={onClick} disabled={disabled}
      className="tile flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-extrabold uppercase disabled:opacity-50">
      {icon}<span className="flex-1">{label}</span>{right}
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-3 p-5">
      <h3 className="text-2xl font-extrabold">Hearts</h3>
      <div className="flex gap-2">
        {Array.from({ length: me.max_hearts }, (_, i) => (
          <HeartIcon key={i} size={34} state={i < me.hearts ? "full" : i === me.hearts ? "next" : "empty"} />
        ))}
      </div>
      <p className="text-lg font-extrabold">{full ? "You have full hearts" : <>Next heart in <span className="text-red">{wait}</span></>}</p>
      <p className="text-center text-muted">
        {me.hearts === 0 ? "You ran out of hearts! Refill or practice to keep learning." : full ? "Keep on learning!" : "You still have hearts left! Keep on learning"}
      </p>
      {row(<span className="text-xl">💜</span>, "Unlimited hearts", <span className="text-[#ce82ff]">Free trial</span>,
        () => toast("Unlimited hearts with Super are coming soon"))}
      {row(<HeartIcon size={24} />, "Refill hearts",
        <span className="flex items-center gap-1 text-blue"><GemIcon size={20} />{REFILL_COST}</span>, refill, full || me.gems < REFILL_COST)}
      {row(<HeartIcon size={20} />, "Practice to earn hearts", null, practice)}
    </div>
  );
}
