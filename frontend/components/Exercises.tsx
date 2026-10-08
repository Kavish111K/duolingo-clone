"use client";
import { useState } from "react";
import { shuffle, speak } from "@/lib/api";
import { Exercise } from "@/lib/types";
import Mascot from "./Mascot";

// Every exercise component gets the same props.
// onAnswer(null) means "nothing selected yet" and keeps the CHECK button disabled.
export interface ExerciseProps {
  exercise: Exercise;
  locked: boolean; // true after CHECK is pressed
  onAnswer: (answer: string | null) => void;
}

// Mascot "saying" a sentence, with an optional speaker button for text-to-speech
function SpeechBubble({ text, audio }: { text: string; audio?: string }) {
  return (
    <div className="mb-6 flex items-end gap-3">
      <Mascot size={100} />
      <div className="relative mb-8 flex items-center gap-2 rounded-2xl border-2 border-line px-4 py-3 text-lg">
        {audio && <button onClick={() => speak(audio)} className="text-2xl text-blue" aria-label="Play audio">🔊</button>}
        {text}
      </div>
    </div>
  );
}

// ---------- 1. multiple choice (picture cards) ----------
export function MultipleChoice({ exercise, locked, onAnswer }: ExerciseProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const { options = [], emojis } = exercise.data;

  const choose = (option: string) => {
    if (locked) return;
    setSelected(option);
    speak(option);
    onAnswer(option);
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map((option, i) => (
        <button key={option} onClick={() => choose(option)}
          className={`tile flex flex-col items-center gap-3 p-4 ${selected === option ? "selected" : ""}`}>
          {emojis && <span className="text-6xl">{emojis[i]}</span>}
          <span className="text-lg font-bold">{option}</span>
        </button>
      ))}
    </div>
  );
}

// ---------- 2. translate with a word bank ("tap the words") ----------
export function WordBank({ exercise, locked, onAnswer }: ExerciseProps) {
  const words = exercise.data.words ?? [];
  const [chosen, setChosen] = useState<number[]>([]); // indexes into words

  const update = (next: number[]) => {
    setChosen(next);
    onAnswer(next.length ? next.map((i) => words[i]).join(" ") : null);
  };
  const add = (i: number) => {
    if (locked) return;
    speak(words[i]);
    update([...chosen, i]);
  };
  const remove = (i: number) => !locked && update(chosen.filter((c) => c !== i));

  return (
    <div>
      <SpeechBubble text={exercise.data.sentence ?? ""} />
      <div className="mb-8 flex min-h-[60px] flex-wrap gap-2 border-b-2 border-t-2 border-line py-2">
        {chosen.map((i) => (
          <button key={i} onClick={() => remove(i)} className="tile px-4 py-2 text-lg">{words[i]}</button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {words.map((w, i) => (
          <button key={i} onClick={() => add(i)} className={`tile px-4 py-2 text-lg ${chosen.includes(i) ? "used" : ""}`}>
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- 3. match pairs (wrong pairs flash red but don't cost a heart) ----------
export function MatchPairs({ exercise, onAnswer }: ExerciseProps) {
  const pairs = exercise.data.pairs ?? [];
  const [left] = useState(() => shuffle(pairs.map((p) => p[0])));
  const [right] = useState(() => shuffle(pairs.map((p) => p[1])));
  const [selLeft, setSelLeft] = useState<string | null>(null);
  const [selRight, setSelRight] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]); // matched Spanish words
  const [wrong, setWrong] = useState(false);

  const tryMatch = (l: string | null, r: string | null) => {
    if (!l || !r) return;
    if (pairs.some((p) => p[0] === l && p[1] === r)) {
      const next = [...matched, l];
      setMatched(next);
      if (next.length === pairs.length) onAnswer("done");
      setSelLeft(null);
      setSelRight(null);
    } else {
      setWrong(true);
      setTimeout(() => { setWrong(false); setSelLeft(null); setSelRight(null); }, 500);
    }
  };

  const pickLeft = (w: string) => { if (wrong) return; speak(w); setSelLeft(w); tryMatch(w, selRight); };
  const pickRight = (w: string) => { if (wrong) return; setSelRight(w); tryMatch(selLeft, w); };
  const englishMatched = (w: string) => matched.some((m) => pairs.find((p) => p[0] === m)?.[1] === w);

  const tileClass = (selected: boolean, done: boolean) =>
    `tile w-full p-4 text-lg ${done ? "used !text-muted" : selected ? (wrong ? "wrong animate-shake" : "selected") : ""}`;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-3">
        {left.map((w) => (
          <button key={w} onClick={() => pickLeft(w)} className={tileClass(selLeft === w, matched.includes(w))}>{w}</button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {right.map((w) => (
          <button key={w} onClick={() => pickRight(w)} className={tileClass(selRight === w, englishMatched(w))}>{w}</button>
        ))}
      </div>
    </div>
  );
}

// ---------- 4. fill in the blank ----------
export function FillBlank({ exercise, locked, onAnswer }: ExerciseProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [before, after] = (exercise.data.sentence ?? "").split("___");

  const choose = (option: string) => {
    if (locked) return;
    setSelected(option);
    speak(option);
    onAnswer(option);
  };

  return (
    <div>
      <p className="mb-10 text-2xl">
        {before}
        <span className="mx-1 inline-block min-w-[90px] border-b-2 border-fg text-center font-extrabold text-blue">
          {selected ?? " "}
        </span>
        {after}
      </p>
      <div className="flex flex-col gap-3">
        {exercise.data.options?.map((option, i) => (
          <button key={option} onClick={() => choose(option)}
            className={`tile flex items-center gap-4 p-4 text-left text-lg ${selected === option ? "selected" : ""}`}>
            <span className="rounded-lg border-2 border-line px-2 text-sm text-muted">{i + 1}</span>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- 5. type the answer ----------
export function TypeAnswer({ exercise, locked, onAnswer }: ExerciseProps) {
  const sentence = exercise.data.sentence ?? "";
  return (
    <div>
      <SpeechBubble text={sentence} audio={sentence} />
      <textarea
        autoFocus
        disabled={locked}
        onChange={(e) => onAnswer(e.target.value.trim() || null)}
        placeholder="Type in English"
        className="h-36 w-full resize-none rounded-2xl border-2 border-line bg-soft p-4 text-lg outline-none focus:border-blue"
      />
    </div>
  );
}
