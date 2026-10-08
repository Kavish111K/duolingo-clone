"use client";
import { useEffect, useState } from "react";
import { api, getPref, Pref, setPref, setTheme, Theme } from "@/lib/api";
import { useUser } from "@/components/Layout";

const GOALS = [
  { xp: 10, label: "Casual" },
  { xp: 20, label: "Regular" },
  { xp: 30, label: "Serious" },
  { xp: 50, label: "Intense" },
];

const PREFS: { key: Pref; label: string }[] = [
  { key: "sound", label: "Sound effects" },
  { key: "animations", label: "Animations" },
  { key: "motivational", label: "Motivational messages" },
  { key: "listening", label: "Listening exercises" },
];

function Toggle({ on, onClick, label }: { on: boolean; onClick?: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} disabled={!onClick}
      className={`relative h-9 w-[70px] shrink-0 rounded-xl transition-colors ${on ? "bg-blue" : "bg-line"}`}>
      <span className={`absolute top-0 h-9 w-9 rounded-xl border-2 bg-bg transition-all ${on ? "right-0 border-blue" : "right-[34px] border-line"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { me, refresh, toast } = useUser();
  const [prefs, setPrefs] = useState<Record<Pref, boolean>>({ sound: true, animations: true, motivational: true, listening: true });
  const [theme, setThemeState] = useState<Theme>("system");

  // read the saved choices once the page is in the browser
  useEffect(() => {
    setPrefs({ sound: getPref("sound"), animations: getPref("animations"), motivational: getPref("motivational"), listening: getPref("listening") });
    try { setThemeState((localStorage.getItem("theme") as Theme) || "system"); } catch {}
  }, []);

  const togglePref = (key: Pref) => {
    setPref(key, !prefs[key]);
    setPrefs({ ...prefs, [key]: !prefs[key] });
  };

  const changeTheme = (t: Theme) => {
    setTheme(t);
    setThemeState(t);
  };

  const setGoal = async (xp: number) => {
    await api("/settings", "PUT", { daily_goal: xp });
    refresh();
  };

  // Testing helper so the streak logic can be checked without waiting a day
  const nextDay = async () => {
    await api("/dev/next-day", "POST");
    refresh();
    toast("⏩ Moved to the next day");
  };

  const sectionTitle = "mb-6 border-b-2 border-line pb-3 text-xl font-extrabold";

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl font-extrabold">Preferences</h1>

      <section>
        <h2 className={sectionTitle}>Lesson experience</h2>
        <div className="flex flex-col gap-6">
          {PREFS.map((p) => (
            <div key={p.key} className="flex items-center justify-between font-extrabold">
              {p.label}
              <Toggle on={prefs[p.key]} onClick={() => togglePref(p.key)} label={p.label} />
            </div>
          ))}
          <div className="flex items-center justify-between font-extrabold text-muted">
            <span>Speaking exercises <span className="ml-2 rounded-lg bg-gold px-2 py-0.5 text-xs uppercase text-white">Soon</span></span>
            <Toggle on={false} label="Speaking exercises" />
          </div>
        </div>
      </section>

      <section>
        <h2 className={sectionTitle}>Appearance</h2>
        <label className="mb-2 block font-extrabold" htmlFor="theme">Dark mode</label>
        <select id="theme" value={theme} onChange={(e) => changeTheme(e.target.value as Theme)}
          className="w-full cursor-pointer rounded-2xl border-2 border-line bg-soft px-4 py-3 font-extrabold uppercase outline-none"
          style={{ boxShadow: "0 2px 0 var(--line)" }}>
          <option value="system">System default</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </section>

      <section>
        <h2 className={sectionTitle}>Daily goal</h2>
        <div className="flex flex-col gap-2">
          {GOALS.map((g) => (
            <button key={g.xp} onClick={() => setGoal(g.xp)}
              className={`tile flex justify-between p-4 font-bold ${me?.daily_goal === g.xp ? "selected" : ""}`}>
              <span>{g.label}</span>
              <span>{g.xp} XP per day</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className={sectionTitle}>Developer tools</h2>
        <p className="mb-4 text-muted">Simulate a new day to test streaks and the daily goal.</p>
        <button className="btn btn-outline" onClick={nextDay}>Next day ⏩</button>
      </section>
    </div>
  );
}
