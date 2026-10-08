"use client";
import { api } from "@/lib/api";
import { useUser } from "@/components/Layout";

function ShopItem({ icon, title, text, children }: { icon: string; title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-t-2 border-line py-6">
      <span className="text-5xl">{icon}</span>
      <div className="flex-1">
        <h3 className="text-lg font-extrabold">{title}</h3>
        <p className="text-muted">{text}</p>
      </div>
      {children}
    </div>
  );
}

export default function ShopPage() {
  const { me, refresh, toast } = useUser();

  const refill = async () => {
    try {
      await api("/hearts/refill", "POST");
      refresh();
      toast("❤️ Hearts refilled!");
    } catch (e) {
      toast((e as Error).message);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">Shop</h1>
      <h2 className="mb-2 text-xl font-extrabold">Hearts</h2>
      <ShopItem icon="❤️" title="Refill hearts" text={`Get full hearts so you can keep learning. You have ${me?.hearts ?? 0}/5.`}>
        <button className="btn btn-outline" onClick={refill} disabled={!me || me.hearts === 5}>
          {me?.hearts === 5 ? "Full" : "💎 350"}
        </button>
      </ShopItem>
      <ShopItem icon="♾️" title="Unlimited hearts" text="Never run out of hearts with Super.">
        <span className="rounded-xl bg-gold px-3 py-1 text-sm font-extrabold uppercase text-white">Soon</span>
      </ShopItem>
      <h2 className="mb-2 mt-6 text-xl font-extrabold">Power-ups</h2>
      <ShopItem icon="🧊" title="Streak freeze" text="Keep your streak safe if you miss a day.">
        <span className="rounded-xl bg-gold px-3 py-1 text-sm font-extrabold uppercase text-white">Soon</span>
      </ShopItem>
    </div>
  );
}
