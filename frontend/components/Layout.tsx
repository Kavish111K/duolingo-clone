"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LeaderboardRow, Me } from "@/lib/types";
import Mascot from "./Mascot";
import Onboarding from "./Onboarding";
import { Toast } from "./Popups";
import { BoltIcon, ChestIcon, EnvelopeIcon, FlagIcon, FlameIcon, GemIcon, HeartIcon, HouseIcon, SearchIcon, ShieldIcon, ShopIcon } from "./Icons";

// ---------- shared learner stats + a toast any page can show ----------
interface AppState {
  me: Me | null;
  refresh: () => void;
  toast: (message: string) => void;
}
const UserContext = createContext<AppState>({ me: null, refresh: () => {}, toast: () => {} });
export const useUser = () => useContext(UserContext);

// ---------- page shell: sidebar + center column + right panel ----------
export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const refresh = useCallback(() => {
    api<Me>("/me").then(setMe).catch(() => setMe(null));
  }, []);
  const closeToast = useCallback(() => setMessage(null), []);
  const [skipped, setSkipped] = useState(false); // ✕ hides the level question until Learn is opened again

  useEffect(refresh, [path, refresh]); // reload stats whenever the page changes
  useEffect(() => setSkipped(false), [path]);

  const saveLevel = async (level: number) => {
    setMe(await api<Me>("/settings", "PUT", { proficiency: level }));
    setMessage("Great! Let's start learning 🎉");
  };
  const askLevel = path === "/" && me !== null && me.proficiency === null && !skipped;

  return (
    <UserContext.Provider value={{ me, refresh, toast: setMessage }}>
      <Toast message={message} onClose={closeToast} />
      {askLevel && <Onboarding onSubmit={saveLevel} onClose={() => setSkipped(true)} />}
      {path.startsWith("/lesson") ? children : (
        <>
          <Sidebar />
          <div className="flex justify-center gap-12 md:pl-64">
            <main className="w-full max-w-[600px] px-4 pb-24 md:pt-6">
              <div className="sticky top-0 z-30 mb-4 border-b-2 border-line bg-bg py-3 lg:hidden">
                <StatsBar />
              </div>
              {children}
            </main>
            {/* right column changes with the page, like on Duolingo */}
            <aside className="sticky top-0 hidden h-screen w-[368px] shrink-0 flex-col gap-6 overflow-y-auto px-6 py-6 lg:flex">
              {path === "/settings" ? <SettingsMenu /> : (
                <>
                  <StatsBar />
                  {path === "/quests" ? <MonthlyCard /> : path === "/profile" ? <FriendsCards /> : (
                    <>
                      <SuperCard />
                      <LeagueCard />
                      <DailyGoal />
                    </>
                  )}
                  <Footer />
                </>
              )}
            </aside>
          </div>
        </>
      )}
    </UserContext.Provider>
  );
}

const NAV = [
  { href: "/", label: "Learn", icon: <HouseIcon size={36} /> },
  { href: "/leaderboard", label: "Leaderboards", icon: <ShieldIcon size={36} /> },
  { href: "/quests", label: "Quests", icon: <ChestIcon size={38} /> },
  { href: "/shop", label: "Shop", icon: <ShopIcon size={36} /> },
];

function Sidebar() {
  const path = usePathname();
  const { me, toast } = useUser();
  const [moreOpen, setMoreOpen] = useState(false);
  const itemClass = (active: boolean) =>
    `flex w-full items-center gap-4 rounded-xl border-2 px-3 py-2 font-extrabold uppercase tracking-wide text-[15px] ${
      active ? "border-[#84d8ff] bg-sel text-blue" : "border-transparent text-fg hover:bg-soft"
    }`;
  // every icon sits in the same fixed-size box so the labels line up and icons never shrink
  const box = (icon: React.ReactNode) => <span className="flex h-10 w-10 shrink-0 items-center justify-center">{icon}</span>;
  const avatar = (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-muted text-sm text-muted">
      {me?.display_name[0] ?? "?"}
    </span>
  );
  const dots = <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ce82ff] text-sm text-white">•••</span>;

  return (
    <>
      {/* desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col gap-2 border-r-2 border-line px-4 py-6 md:flex">
        <Link href="/" className="mb-6 px-4 text-[34px] font-black lowercase tracking-tight text-green">duolingo</Link>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={itemClass(path === n.href)}>{box(n.icon)}{n.label}</Link>
        ))}
        <Link href="/profile" className={itemClass(path === "/profile")}>{box(avatar)}Profile</Link>
        <div className="relative" onMouseLeave={() => setMoreOpen(false)}>
          <button className={itemClass(path === "/settings")} onClick={() => setMoreOpen(!moreOpen)} onMouseEnter={() => setMoreOpen(true)}>
            {box(dots)}More
          </button>
          {moreOpen && (
            <div className="absolute left-full top-0 z-40 w-56 overflow-hidden rounded-2xl border-2 border-line bg-bg font-extrabold uppercase">
              <Link href="/settings" className="block px-5 py-3 hover:bg-soft">Settings</Link>
              <button className="block w-full px-5 py-3 text-left uppercase hover:bg-soft" onClick={() => toast("Help center is coming soon")}>
                Help
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 z-30 flex w-full justify-around border-t-2 border-line bg-bg py-2 md:hidden">
        {[...NAV, { href: "/profile", label: "Profile", icon: avatar }, { href: "/settings", label: "Settings", icon: dots }].map((n) => (
          <Link key={n.href} href={n.href} aria-label={n.label}
            className={`rounded-xl border-2 p-2 ${path === n.href ? "border-[#84d8ff] bg-sel" : "border-transparent"}`}>
            {box(n.icon)}
          </Link>
        ))}
      </nav>
    </>
  );
}

export function Flag({ size = 40 }: { size?: number }) {
  return <FlagIcon width={size} />;
}

function StatsBar() {
  const { me, toast } = useUser();
  const [coursesOpen, setCoursesOpen] = useState(false);
  if (!me) return <div className="h-10" />;

  return (
    <div className="flex items-center justify-between gap-2 text-lg font-extrabold">
      {/* language flag with the "My courses" dropdown */}
      <div className="relative" onMouseLeave={() => setCoursesOpen(false)}>
        <button className="rounded-xl p-2 hover:bg-soft" onClick={() => setCoursesOpen(!coursesOpen)} onMouseEnter={() => setCoursesOpen(true)}>
          <Flag />
        </button>
        {coursesOpen && (
          <div className="absolute left-0 top-full z-40 w-72 overflow-hidden rounded-2xl border-2 border-line bg-bg">
            <p className="border-b-2 border-line px-5 py-3 text-sm uppercase text-muted">My courses</p>
            <div className="flex items-center gap-4 border-b-2 border-line bg-sel px-5 py-3 text-blue"><Flag /> Spanish</div>
            <button className="flex w-full items-center gap-4 px-5 py-3 hover:bg-soft" onClick={() => toast("More languages are coming soon")}>
              <span className="flex h-[30px] w-10 items-center justify-center rounded-md border-2 border-line text-muted">+</span>
              Add a new course
            </button>
          </div>
        )}
      </div>
      <span className={`flex items-center gap-2 ${me.streak > 0 ? "text-orange" : "text-line"}`} title="Day streak">
        <FlameIcon active={me.streak > 0} />{me.streak}
      </span>
      <Link href="/shop" className="flex items-center gap-2 text-blue" title="Gems"><GemIcon />{me.gems}</Link>
      <Link href="/shop" className="flex items-center gap-2 text-red" title="Hearts"><HeartIcon />{me.hearts}</Link>
    </div>
  );
}

// Mocked "Super" subscription advert
function SuperCard() {
  const { toast } = useUser();
  return (
    <div className="card relative overflow-hidden">
      <span className="rounded-lg bg-gradient-to-r from-green to-blue px-2 py-0.5 text-sm font-black italic text-white">SUPER</span>
      <div className="absolute right-3 top-3 hue-rotate-[150deg] saturate-200"><Mascot size={80} /></div>
      <h3 className="mt-3 text-xl font-extrabold">Try Super for free</h3>
      <p className="mb-5 mt-2 pr-16 text-muted">No ads, personalized practice, and unlimited Legendary!</p>
      <button className="btn w-full text-white" style={{ background: "#3c4cff", boxShadow: "0 4px 0 #2b36b8" }}
        onClick={() => toast("Super subscriptions are coming soon")}>
        Try 1 week free
      </button>
    </div>
  );
}

// "Earn N XP" quest row with a progress bar ending in a chest (used in the right panel and on the quests page)
export function QuestRow() {
  const { me } = useUser();
  if (!me) return null;
  const pct = Math.min(100, (me.today_xp / me.daily_goal) * 100);
  return (
    <div className="flex items-center gap-5">
      <BoltIcon size={44} />
      <div className="flex-1">
        <p className="mb-3 text-lg font-extrabold">Earn {me.daily_goal} XP</p>
        <div className="flex items-center">
          <div className="relative h-5 flex-1 rounded-full bg-line">
            <div className="h-5 rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
            <span className="absolute inset-0 text-center text-xs font-extrabold leading-5 text-fg/70">
              {me.today_xp} / {me.daily_goal}
            </span>
          </div>
          <span className="-ml-2"><ChestIcon size={40} /></span>
        </div>
      </div>
    </div>
  );
}

function DailyGoal() {
  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-extrabold">Daily Quests</h3>
        <Link href="/quests" className="font-extrabold uppercase text-blue">View all</Link>
      </div>
      <QuestRow />
    </div>
  );
}

function LeagueCard() {
  const path = usePathname();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  useEffect(() => {
    api<LeaderboardRow[]>("/leaderboard").then(setRows).catch(() => {});
  }, [path]);
  const mine = rows.find((r) => r.is_me);

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xl font-extrabold">Bronze League</h3>
        <Link href="/leaderboard" className="font-extrabold uppercase text-blue">View league</Link>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-5xl">🥉</span>
        <p className="text-muted">
          {mine ? <>You&apos;re ranked <b className="text-fg">#{mine.rank}</b> with {mine.weekly_xp} XP this week</> : "Loading..."}
        </p>
      </div>
    </div>
  );
}

function MonthlyCard() {
  return (
    <div className="card relative">
      <span className="absolute right-5 top-5 flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#e5a000] bg-gold">
        <BoltIcon size={44} color="#ff9600" />
      </span>
      <h3 className="mb-2 pr-24 text-lg font-extrabold">Monthly challenges unlock soon!</h3>
      <p className="mb-5 pr-24 text-muted">Complete each month&apos;s challenge to earn exclusive badges</p>
      <Link href="/" className="btn btn-outline block text-center">Start a lesson</Link>
    </div>
  );
}

// Right column of the profile page (friends are a "coming soon" feature)
function FriendsCards() {
  const { toast } = useUser();
  const [tab, setTab] = useState<"following" | "followers">("following");
  const tabClass = (t: string) =>
    `flex-1 border-b-2 py-4 font-extrabold uppercase tracking-wide ${tab === t ? "border-blue text-blue" : "border-line text-muted"}`;
  const row = (icon: React.ReactNode, label: string) => (
    <button onClick={() => toast("Friends are coming soon")} className="flex w-full items-center gap-5 py-3 text-left">
      {icon}
      <span className="flex-1 text-lg font-extrabold">{label}</span>
      <span className="text-2xl text-muted">›</span>
    </button>
  );

  return (
    <>
      <div className="overflow-hidden rounded-2xl border-2 border-line">
        <div className="flex">
          <button className={tabClass("following")} onClick={() => setTab("following")}>Following</button>
          <button className={tabClass("followers")} onClick={() => setTab("followers")}>Followers</button>
        </div>
        <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
          {/* a little crowd of owls in different colours */}
          <div className="flex items-end -space-x-6">
            <span className="hue-rotate-[200deg]"><Mascot size={70} /></span>
            <span className="hue-rotate-[290deg]"><Mascot size={84} /></span>
            <span className="relative z-[1]"><Mascot size={96} /></span>
            <span className="hue-rotate-[40deg]"><Mascot size={84} /></span>
            <span className="hue-rotate-[120deg]"><Mascot size={70} /></span>
          </div>
          <p className="text-lg text-muted">
            {tab === "following" ? "Learning is more fun and effective when you connect with others." : "No followers yet. Share your profile with friends!"}
          </p>
        </div>
      </div>
      <div className="card">
        <h3 className="mb-2 text-xl font-extrabold">Add friends</h3>
        {row(<SearchIcon />, "Find friends")}
        {row(<EnvelopeIcon />, "Invite friends")}
      </div>
    </>
  );
}

// Right column of the settings page
function SettingsMenu() {
  const { toast } = useUser();
  const soon = (label: string) => (
    <button key={label} onClick={() => toast(`${label} — coming soon`)} className="block py-2 text-left font-extrabold hover:text-blue">
      {label}
    </button>
  );
  return (
    <>
      <div className="card px-8">
        <h3 className="mb-3 text-xl font-extrabold">Account</h3>
        <Link href="/settings" className="block py-2 font-extrabold text-blue">Preferences</Link>
        <Link href="/profile" className="block py-2 font-extrabold hover:text-blue">Profile</Link>
        {["Notifications", "Courses", "Duolingo for Schools", "Social accounts", "Privacy settings"].map(soon)}
      </div>
      <div className="card px-8">
        <h3 className="mb-3 text-xl font-extrabold">Subscription</h3>
        {soon("Choose a plan")}
      </div>
      <div className="card px-8">
        <h3 className="mb-3 text-xl font-extrabold">Support</h3>
        {soon("Help Center")}
      </div>
    </>
  );
}

function Footer() {
  return (
    <p className="flex flex-wrap justify-center gap-x-6 gap-y-3 px-4 text-sm font-extrabold uppercase text-muted">
      {["About", "Blog", "Store", "Efficacy", "Careers", "Investors", "Terms", "Privacy"].map((l) => <span key={l}>{l}</span>)}
    </p>
  );
}
