"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, getPref, normalize, playSound } from "@/lib/api";
import { Exercise, LessonData, LessonMode, LessonResult, Me } from "@/lib/types";
import { useUser } from "./Layout";
import { ExerciseProps, FillBlank, MatchPairs, MultipleChoice, TypeAnswer, WordBank } from "./Exercises";
import { LessonComplete, OutOfHearts, TimeUp, Toast } from "./Popups";

const EXERCISES: Record<Exercise["type"], React.ComponentType<ExerciseProps>> = {
  multiple_choice: MultipleChoice,
  word_bank: WordBank,
  match_pairs: MatchPairs,
  fill_blank: FillBlank,
  type_answer: TypeAnswer,
};

const PRAISE = ["Nice!", "Great job!", "Amazing!", "Correct!", "Excellent!"];
const LEGENDARY_SECONDS = 90;
const expected = (ex: Exercise) => (ex.type === "match_pairs" ? "done" : ex.data.answer ?? "");

export default function LessonPlayer({ skillId, mode }: { skillId: number; mode: LessonMode }) {
  const usesHearts = mode === "normal"; // practice and legendary don't cost hearts
  const router = useRouter();
  const { refresh } = useUser();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [queue, setQueue] = useState<Exercise[]>([]); // wrong answers get pushed to the end
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [status, setStatus] = useState<"answering" | "correct" | "wrong">("answering");
  const [hearts, setHearts] = useState(5);
  const [gems, setGems] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [result, setResult] = useState<LessonResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(LEGENDARY_SECONDS);

  const loadLesson = () =>
    api<LessonData>(`/skills/${skillId}/lesson?mode=${mode}`)
      .then((data) => { setLesson(data); setQueue(data.exercises); })
      // backend refuses to start a lesson with 0 hearts
      .catch((e: Error) => (e.message === "Out of hearts" ? setOutOfHearts(true) : setToast(e.message)));

  useEffect(() => {
    api<Me>("/me").then((me) => { setHearts(me.hearts); setGems(me.gems); });
    loadLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const check = () => {
    if (!answer) return;
    const ex = queue[index];
    if (normalize(answer) === normalize(expected(ex))) {
      setStatus("correct");
      setCorrectCount((c) => c + 1);
      playSound(true);
    } else {
      setStatus("wrong");
      setMistakes((m) => m + 1);
      playSound(false);
      setQueue((q) => [...q, ex]);
      if (usesHearts) {
        setHearts((h) => Math.max(0, h - 1)); // update the screen right away
        api("/hearts/lose", "POST");
      }
    }
  };

  const finish = async () => {
    const res = await api<LessonResult>(`/lessons/${lesson!.lesson_id}/complete`, "POST", { mistakes, mode });
    setResult(res);
    refresh();
    if (res.new_achievements.length) {
      setToast(`🏅 Achievement unlocked: ${res.new_achievements.map((a) => `${a.icon} ${a.title}`).join(", ")}`);
    }
  };

  const next = () => {
    if (hearts === 0 && usesHearts) return setOutOfHearts(true);
    if (index + 1 >= queue.length) return finish();
    setIndex(index + 1);
    setAnswer(null);
    setStatus("answering");
  };

  const refill = async () => {
    try {
      const me = await api<Me>("/hearts/refill", "POST");
      setHearts(me.hearts);
      setGems(me.gems);
      setOutOfHearts(false);
      refresh();
      if (!lesson) loadLesson();
    } catch (e) {
      setToast((e as Error).message);
    }
  };

  // Legendary mode: countdown, the lesson fails when it reaches 0
  useEffect(() => {
    if (mode !== "legendary" || !lesson || result || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(t);
  }, [mode, lesson, result, timeLeft]);

  // Enter key works like the CHECK / CONTINUE button
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || outOfHearts || result || !lesson || timeLeft <= 0) return;
      e.preventDefault();
      if (status === "answering") check();
      else next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (result) {
    const total = lesson!.exercises.length;
    return (
      <>
        <Toast message={toast} onClose={() => setToast(null)} />
        <LessonComplete result={result} accuracy={Math.round((total / (total + mistakes)) * 100)} legendary={mode === "legendary"} />
      </>
    );
  }

  const ex = queue[index];
  const ExerciseView = ex ? EXERCISES[ex.type] : null;
  const progress = lesson ? (correctCount / lesson.exercises.length) * 100 : 0;
  const correct = status === "correct";

  return (
    <div className="flex min-h-screen flex-col">
      <Toast message={toast} onClose={() => setToast(null)} />
      <header className="mx-auto flex w-full max-w-4xl items-center gap-4 px-4 pt-8">
        <Link href="/" className="text-2xl font-bold text-muted" aria-label="Quit lesson">✕</Link>
        <div className="h-4 flex-1 rounded-full bg-line">
          <div className="h-4 rounded-full bg-green transition-all duration-500" style={{ width: `${progress}%` }}>
            <div className="mx-2 h-1 translate-y-1 rounded-full bg-white/30" />
          </div>
        </div>
        {mode === "legendary" ? (
          <span className={`text-lg font-extrabold ${timeLeft <= 10 ? "animate-shake text-red" : "text-gold"}`}>
            ⏱️ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-lg font-extrabold text-red">❤️ {usesHearts ? hearts : "∞"}</span>
        )}
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        {ex && ExerciseView && (
          <>
            {mode === "practice" && <p className="mb-2 font-extrabold uppercase text-orange">Practice · earn a heart</p>}
            {mode === "legendary" && <p className="mb-2 font-extrabold uppercase text-gold">🏆 Legendary · beat the clock</p>}
            <h1 className="mb-8 text-2xl font-extrabold sm:text-3xl">{ex.prompt}</h1>
            <ExerciseView key={index} exercise={ex} locked={status !== "answering"} onAnswer={setAnswer} />
          </>
        )}
      </main>

      {/* bottom bar: CHECK button, which turns into the green/red feedback bar */}
      {ex && status === "answering" && (
        <footer className="border-t-2 border-line">
          <div className="mx-auto flex max-w-4xl justify-end px-4 py-6">
            <button className="btn btn-green w-full sm:w-40" disabled={!answer} onClick={check}>Check</button>
          </div>
        </footer>
      )}
      {ex && status !== "answering" && (
        <footer className="animate-slide-up" style={{ background: correct ? "var(--ok-bg)" : "var(--bad-bg)" }}>
          <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="hidden h-16 w-16 items-center justify-center rounded-full bg-bg text-4xl sm:flex">
                {correct ? "✅" : "❌"}
              </span>
              <div className={correct ? "text-[#58a700]" : "text-[#ea2b2b]"}>
                <h3 className="text-2xl font-extrabold">{!correct ? "Correct solution:" : getPref("motivational") ? PRAISE[index % PRAISE.length] : "Correct"}</h3>
                {!correct && <p className="text-lg">{expected(ex)}</p>}
              </div>
            </div>
            <button className={`btn w-full sm:w-40 ${correct ? "btn-green" : "btn-red"}`} onClick={next}>Continue</button>
          </div>
        </footer>
      )}

      {outOfHearts && (
        <OutOfHearts gems={gems} onRefill={refill} onPractice={() => router.push(`/lesson/${skillId}?mode=practice`)} />
      )}
      {timeLeft <= 0 && <TimeUp onRetry={() => window.location.reload()} />}
    </div>
  );
}
