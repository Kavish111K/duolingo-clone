"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LeaderboardRow } from "@/lib/types";

const RANK_COLORS = ["#ffc800", "#c0c0c0", "#cd7f32"];

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    api<LeaderboardRow[]>("/leaderboard").then(setRows).catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-col items-center gap-2 border-b-2 border-line pb-6 text-center">
        <span className="text-6xl">🥉</span>
        <h1 className="text-2xl font-extrabold">Bronze League</h1>
        <p className="text-muted">Top 3 advance to the next league. Earn XP to climb the ranks!</p>
      </div>
      <ul>
        {rows.map((r) => (
          <li key={r.id} className={`flex items-center gap-4 rounded-xl px-4 py-3 ${r.is_me ? "bg-sel" : ""}`}>
            <span className="w-6 text-center font-extrabold" style={{ color: RANK_COLORS[r.rank - 1] ?? "var(--muted)" }}>
              {r.rank}
            </span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full text-xl font-extrabold text-white"
              style={{ background: r.avatar_color }}>
              {r.display_name[0]}
            </span>
            <span className={`flex-1 font-bold ${r.is_me ? "text-blue" : ""}`}>{r.display_name}</span>
            <span className="text-muted">{r.weekly_xp} XP</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
