"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Profile } from "@/lib/types";
import { Flag, useUser } from "@/components/Layout";
import { LEVELS } from "@/components/Onboarding";
import { AvatarPlaceholder, BoltIcon, FlameIcon, ShieldIcon } from "@/components/Icons";

// Statistic card; the icon turns grey while the value is still zero, like on Duolingo
function Stat({ icon, value, label, active }: { icon: React.ReactNode; value: string | number; label: string; active: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-line px-5 py-4">
      <span className={active ? "" : "opacity-40 grayscale"}>{icon}</span>
      <div>
        <p className={`text-xl font-extrabold ${active ? "" : "text-muted"}`}>{value}</p>
        <p className="text-muted">{label}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { refresh } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const load = () => api<Profile>("/profile").then(setProfile).catch(() => {});

  useEffect(() => { load(); }, []);

  const editName = async () => {
    const name = window.prompt("Your name", profile?.display_name)?.trim();
    if (!name) return;
    await api("/settings", "PUT", { display_name: name });
    load();
    refresh();
  };

  if (!profile) return <p className="py-10 text-center text-muted">Loading...</p>;

  return (
    <div className="flex flex-col gap-8">
      {/* banner with the empty profile picture */}
      <div className="relative flex h-[280px] items-end justify-center overflow-hidden rounded-2xl bg-sel">
        <AvatarPlaceholder height={250} />
        <button onClick={editName} aria-label="Edit profile"
          className="btn btn-outline absolute right-5 top-5 px-3 py-2 text-xl">✏️</button>
      </div>

      <div className="border-b-2 border-line pb-8">
        <h1 className="text-3xl font-extrabold uppercase">{profile.display_name}</h1>
        <p className="mt-1 uppercase text-muted">{profile.username}</p>
        <p className="mt-2">Joined {new Date(profile.joined).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        {profile.proficiency !== null && <p className="text-muted">{LEVELS[profile.proficiency]}</p>}
        <div className="mt-3 flex items-center justify-between">
          <p className="flex gap-6 font-extrabold text-blue">
            <span>0 Following</span>
            <span>0 Followers</span>
          </p>
          <Flag />
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-2xl font-extrabold">Statistics</h2>
        <div className="grid grid-cols-2 gap-4">
          <Stat icon={<FlameIcon size={30} />} value={profile.streak} label="Day streak" active={profile.streak > 0} />
          <Stat icon={<BoltIcon size={30} />} value={profile.xp} label="Total XP" active={profile.xp > 0} />
          <Stat icon={<ShieldIcon size={30} />} value="Bronze" label="Current league" active />
          <Stat icon={<span className="text-2xl">📘</span>} value={profile.lessons_completed} label="Lessons completed"
            active={profile.lessons_completed > 0} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-extrabold">Achievements</h2>
        <div className="rounded-2xl border-2 border-line">
          {profile.achievements.map((a) => (
            <div key={a.key} className={`flex items-center gap-4 border-b-2 border-line p-4 last:border-0 ${a.unlocked ? "" : "opacity-40 grayscale"}`}>
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-soft text-4xl">{a.icon}</span>
              <div className="flex-1">
                <p className="text-lg font-extrabold">{a.title}</p>
                <p className="text-muted">{a.description}</p>
              </div>
              {a.unlocked && <span className="font-extrabold text-green">✓</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
