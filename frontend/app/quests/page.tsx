"use client";
import { QuestRow } from "@/components/Layout";
import { ChestIcon, LockIcon } from "@/components/Icons";
import Mascot from "@/components/Mascot";

export default function QuestsPage() {
  const hoursLeft = 24 - new Date().getHours(); // daily quests refresh at midnight

  return (
    <div className="flex flex-col gap-6">
      <div className="relative flex items-center overflow-hidden rounded-2xl bg-[#8f6acb] p-8 text-white">
        <div className="flex-1 pr-4">
          <h1 className="mb-3 text-3xl font-extrabold">Welcome!</h1>
          <p className="text-lg">Complete quests to earn rewards! Quests refresh every day.</p>
        </div>
        <div className="relative hidden shrink-0 sm:block">
          <span className="absolute -left-6 top-6 text-2xl">✦</span>
          <span className="absolute -top-2 right-2 text-lg">✦</span>
          <span className="absolute -top-4 left-0 -rotate-12"><ChestIcon size={52} /></span>
          <Mascot size={140} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold">Daily Quests</h2>
        <span className="font-extrabold uppercase text-orange">⏱ {hoursLeft} hours</span>
      </div>
      <div className="card"><QuestRow /></div>
      <div className="card flex items-center gap-6 text-lg font-extrabold text-muted">
        <LockIcon />
        More quests unlock soon
      </div>
    </div>
  );
}
