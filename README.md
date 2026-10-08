# Duolingo Clone

**Live demo:** https://duolingo-clone-ivory-two.vercel.app
**API:** https://duolingo-clone-production-6f65.up.railway.app/docs

A Duolingo-style web app for learning Spanish. It has a learning path with lock/unlock progression, a lesson player with 5 exercise types, and gamification: XP, streaks, hearts, a daily goal, a leaderboard and achievements.

## Setup instructions

**Backend** (Python 3.10+)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows  (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```
On first start the tables are created and the seed data is inserted. Interactive API docs: http://localhost:8000/docs

To reset all progress, stop the server, delete `backend/duolingo.db` and start the server again.

**Frontend** (Node 18+)
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:3000. The API URL defaults to `http://localhost:8000/api`. You can change it with `NEXT_PUBLIC_API_URL`.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Nunito font |
| Backend | Python, FastAPI, SQLAlchemy 2 |
| Database | SQLite (`backend/duolingo.db`, created and seeded automatically) |

## Architecture overview

```
frontend (Next.js)  ──fetch JSON──►  backend (FastAPI)  ──SQLAlchemy──►  SQLite
```

```
backend/
  app.py            the FastAPI app: all API routes + game rules (streak, hearts, achievements)
  models.py         database setup + SQLAlchemy tables
  seed.py           course content, sample learner, leaderboard users
  requirements.txt
frontend/
  app/              one folder per page: learn (page.tsx), leaderboard, quests, shop, profile, settings,
                    lesson/[skillId] (full-screen lesson)
  components/
    Layout.tsx        page shell: sidebar, right panel, shared learner stats
    TopBar.tsx        top bar (flag, streak, gems, hearts) and its popups
    LessonPlayer.tsx  the lesson loop: check answers, hearts, feedback bar, finish
    Exercises.tsx     the 5 exercise types (all take the same props)
    Popups.tsx        toast, out-of-hearts popup, time's-up popup, lesson-complete screen
    Onboarding.tsx    "How much Spanish do you know?" screen
    Mascot.tsx        owl mascot + "coming soon" block
    Icons.tsx         SVG icons (house, shield, chest, shop, flame, gem, heart, bolt, lock)
  lib/api.ts        API calls, text-to-speech, small helpers
  lib/types.ts      TypeScript types for API data
```

In `app.py`, the game rules are plain functions at the top, and the routes below call them. On the frontend, every exercise component takes the same props (`exercise`, `locked`, `onAnswer`). The lesson player picks one through a type → component map, so a new exercise type only needs a new component.

## Database schema

```
courses (id, language, title, flag)
  └── units (id, course_id FK, position, title, description, color)
        └── skills (id, unit_id FK, position, title, icon)
              └── lessons (id, skill_id FK, position)
                    └── exercises (id, lesson_id FK, position, type, prompt, data JSON)

users (id, username UNIQUE, display_name, avatar_color, xp, gems, hearts, hearts_updated_at,
       streak, longest_streak, last_active_date, daily_goal, day_offset, proficiency, created_at)

user_skill_progress (id, user_id FK, skill_id FK, lessons_completed, completed, legendary)   UNIQUE(user_id, skill_id)
lesson_completions  (id, user_id FK, lesson_id FK, xp_earned, mistakes, completed_on)
achievements        (id, key UNIQUE, title, description, icon, metric, threshold)
user_achievements   (id, user_id FK, achievement_id FK, unlocked_at)            UNIQUE(user_id, achievement_id)
```

- Content is a strict hierarchy (course → unit → skill → lesson → exercise). Each level has a `position` for ordering.
- `exercises.data` is JSON because each exercise type needs a different shape:
  - multiple choice: `{options, answer, emojis}`
  - word bank: `{sentence, answer, words}`
  - match pairs: `{pairs}`
  - fill in the blank: `{sentence, answer, options}`
  - type the answer: `{sentence, answer}`
- `user_skill_progress` drives the path. A skill is unlocked when the previous skill is completed.
- `lesson_completions` is the activity log. Daily-goal XP (sum for today) and weekly leaderboard XP (sum since Monday) are computed from it, so they are never stored twice.
- `achievements` are data-driven (`metric` = xp | streak | lessons, plus a `threshold`), so new badges need no code changes.

## API overview (prefix `/api`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/me` | Learner stats: xp, gems, hearts (after regen), streak, today's XP, daily goal, proficiency, this week's streak days (`streak_week`) and minutes until the next heart (`next_heart_minutes`) |
| GET | `/course` | Units → skills with status `locked/available/completed` and lesson progress |
| GET | `/skills/{id}/lesson?mode=` | Next lesson of a skill with its exercises. `mode` = normal / practice / legendary (403 if locked, or out of hearts in normal mode) |
| POST | `/lessons/{id}/complete` | Body `{mistakes, mode}`. Awards XP, updates streak/progress (practice: +1 heart, legendary: marks the skill), returns new achievements |
| POST | `/hearts/lose` | Lose one heart (wrong answer) |
| POST | `/hearts/refill` | Refill hearts for 350 gems |
| GET | `/leaderboard` | Weekly XP ranking |
| GET | `/profile` | Stats + achievements |
| PUT | `/settings` | Update `daily_goal` / `display_name` / `proficiency` (0–4) |
| POST | `/dev/next-day` | Testing helper: simulate the next day (for streaks) |

## Assumptions

- Authentication is simplified: there is always one logged-in learner (user id 1).
- Answers are checked on the client, because the exercise data includes the answer. This keeps the code simple, and a real app would check them on the server. The answer check ignores case and punctuation.
- Gems are mocked: you start with 500, and they are only used to refill hearts.
- Practice lessons don't cost hearts and give +1 heart. They don't advance skill progress.
- Legendary is only available on completed skills. The 90-second timer runs in the browser.
- Audio uses the browser's text-to-speech instead of recorded audio.
- The mascot is an original SVG owl, not Duolingo's artwork.

## Quick tour for evaluators

No Spanish is needed: the [answer key](#answer-key) at the end lists every answer. Answers ignore capital letters and punctuation, and "Type the answer" is always in English.

1. **First screen:** "How much Spanish do you know?" Pick any level and press Continue (or close it with ✕).
2. **Learning path:** Basics is already completed (✓, 2 crowns). Click the bouncing **START** node (Greetings) → **Start +15 XP**.
3. **Lesson:** 5 exercise types, a progress bar and the green/red feedback bar. **Enter** works like the Check/Continue button, and 🔊 reads the Spanish aloud.
   - A wrong answer costs a heart, shows the correct solution, and the question comes back at the end of the lesson.
4. **Lesson complete:** XP, accuracy and streak, with confetti. Finish both Greetings lessons to unlock **Food** and see the treasure chest turn gold.
5. **Hearts:** you have 5. At 0 the out-of-hearts popup offers a refill (350 💎, you have 500) or a practice lesson that earns a heart back. Hearts also regenerate 1 every 30 minutes.
6. **Legendary (timed):** click the completed **Basics** node → **Legendary +40 XP** for a 90-second challenge.
7. **Streak:** **More → Settings → Developer tools → Next day** moves the learner to tomorrow. Finish a lesson to grow the streak; skip a day to see it reset.
8. **Other pages:** Leaderboards (weekly league), Quests (daily XP goal), Shop (refill hearts), Profile (stats and achievements), and Settings (daily goal, dark mode, sound and animation toggles).
9. **Responsive:** make the window narrow to see the mobile layout with a bottom navigation bar.

The demo has a single shared learner (login is simplified), so progress you make on the live site is saved for everyone who opens it.

## Features

- **Learning path**: "Section 1, Unit N" banners with a Guidebook button and a zig-zag path of star nodes with treasure chests. Each node is completed (✓), legendary (🏆 gold), available (progress ring + bouncing START) or locked (grey star). Crowns 👑 show lessons finished in a skill. Clicking a node opens a popover with START / PRACTICE / LEGENDARY.
- **Top bar**: course flag with course count, streak, gems and hearts, like Duolingo. Total XP is shown on the profile, the lesson-complete screen and the leaderboard. Each item opens a popup on hover or click:
  - **Courses**: "My courses" (Spanish) and "Add a new course" (coming soon).
  - **Streak**: "N day streak", this week's calendar with a check on each streak day, Friend Streaks (coming soon) and the Streak Society (unlocks at 7 days).
  - **Gems**: your gem count and a link to the shop.
  - **Hearts**: your hearts, "Next heart in …", and Unlimited hearts (coming soon), Refill hearts (350 gems) and Practice to earn hearts.
- **Treasure chests**: grey while locked, gold once the skill before them is completed. Clicking one shows a message; chest rewards are a placeholder.
- **Onboarding**: "How much Spanish do you know?" with 5 levels. It appears when you open the site or go to Learn until you answer it. The answer is saved on the server (`users.proficiency`) and shown on the profile.
- **Lesson player**: multiple choice (picture cards), translate with a word bank, match pairs, fill in the blank, and type the answer. It has a progress bar, a green/red feedback bar with the correct solution, and keyboard support (Enter = check/continue). Wrong answers are repeated at the end of the lesson, like in Duolingo.
- **Hearts**: you lose 1 per wrong answer. At 0 hearts the "out of hearts" modal appears, offering a refill for 350 gems or a practice lesson. Hearts regenerate at 1 every 30 minutes, and each practice lesson gives +1 heart.
- **XP and streak**: each lesson gives 10 XP, plus 5 for a perfect lesson. The streak goes up once per day you finish a lesson and resets if you miss a day.
- **Daily goal**: a progress card for "Earn N XP". The goal (10/20/30/50) can be changed in Settings.
- **Leaderboard**: a weekly "Bronze League" ranked by XP earned since Monday, across 8 seeded learners plus you.
- **Profile**: banner with an empty avatar and an edit button (changes the display name), join date, level, statistics (day streak, total XP, current league, lessons completed) and achievements (locked ones are greyed out). The right column has Following/Followers tabs and Add friends (placeholders).
- **Legendary challenge (timed)**: on a completed skill, a lesson with a 90-second timer and no heart loss. Finishing in time gives 40 XP and turns the node gold; when time runs out, a "Time's up" popup offers a retry.
- **Extras (bonus)**: achievements with unlock toasts, text-to-speech audio (browser `speechSynthesis`, Spanish voice), dark mode, and a responsive layout (bottom nav on mobile).
- **Settings (Preferences)**: toggles for sound effects (correct/wrong sounds made with the Web Audio API), animations, motivational messages and listening exercises (text-to-speech). Dark mode can be System default / Light / Dark. These choices are saved in the browser (`localStorage`). The daily goal is saved on the server.
- **Icons**: the sidebar, top bar, quest and chest icons are hand-drawn SVGs in `components/Icons.tsx`.
- **Placeholders**: these show "Coming soon": Super subscription card, extra courses ("Add a new course"), friends (profile), speaking exercises and sound settings, more quests, streak freeze, Guidebook, and Help.

## Testing the streak

Go to **Settings → Developer tools → Next day**. This shifts the learner's "today" by one day (`users.day_offset`).
- Finish a lesson after one click: the streak goes up by 1.
- Click twice without a lesson in between: the streak shows 0, and the next lesson restarts it at 1.

## Deployment

- **Backend → Railway.** Root directory `backend`. The start command comes from `backend/Procfile`. Add a volume mounted at `/data` and set `DATABASE_URL=sqlite:////data/duolingo.db`, so learner progress survives restarts and redeploys.
- **Frontend → Vercel.** Root directory `frontend`. Set `NEXT_PUBLIC_API_URL=https://<railway-domain>/api` before the first build, because Next.js bakes it into the bundle at build time.
- The database is created and seeded automatically on the first start.

## Answer key

Each skill has 2 lessons, played in order. Every lesson has the same 5 exercise types.

**Basics** (Unit 1)

| Lesson | Multiple choice | Translate (word bank) | Match pairs | Fill in the blank | Type the answer |
|---|---|---|---|---|---|
| 1 | el hombre | Yo soy un hombre | hombre = man, mujer = woman, niño = boy, niña = girl | Yo **soy** una mujer. | the boy |
| 2 | la niña | La mujer está aquí | yo = I, tú = you, él = he, ella = she | Tú **eres** un niño. | the woman |

**Greetings** (Unit 1)

| Lesson | Multiple choice | Translate (word bank) | Match pairs | Fill in the blank | Type the answer |
|---|---|---|---|---|---|
| 1 | hola | Buenos días | hola = hello, adiós = goodbye, gracias = thank you, por favor = please | Buenas **tardes**, ¿cómo estás? | thank you |
| 2 | adiós | ¿Cómo estás? | sí = yes, no = no, bien = well, mal = bad | Estoy muy **bien**, gracias. | good night |

**Food** (Unit 1)

| Lesson | Multiple choice | Translate (word bank) | Match pairs | Fill in the blank | Type the answer |
|---|---|---|---|---|---|
| 1 | la manzana | Yo bebo agua | pan = bread, agua = water, leche = milk, queso = cheese | Ella **come** una manzana. | the bread |
| 2 | la leche | Yo como pan | café = coffee, arroz = rice, huevo = egg, pollo = chicken | Nosotros **bebemos** café. | the red apple |

**Family** (Unit 2)

| Lesson | Multiple choice | Translate (word bank) | Match pairs | Fill in the blank | Type the answer |
|---|---|---|---|---|---|
| 1 | la madre | Mi padre es alto | padre = father, madre = mother, hermano = brother, hermana = sister | Ella es mi **hermana**. | my family |
| 2 | el abuelo | Yo amo a mi familia | hijo = son, hija = daughter, abuelo = grandfather, abuela = grandmother | Mi **hijo** tiene diez años. | the grandmother |

**Animals** (Unit 2)

| Lesson | Multiple choice | Translate (word bank) | Match pairs | Fill in the blank | Type the answer |
|---|---|---|---|---|---|
| 1 | el perro | El gato bebe leche | perro = dog, gato = cat, pájaro = bird, pez = fish | El **gato** come pescado. | the dog |
| 2 | el caballo | Yo tengo un perro | vaca = cow, caballo = horse, cerdo = pig, oso = bear | Tengo un **caballo** grande. | the black cat |

**Colors** (Unit 2)

| Lesson | Multiple choice | Translate (word bank) | Match pairs | Fill in the blank | Type the answer |
|---|---|---|---|---|---|
| 1 | rojo | El coche es azul | rojo = red, azul = blue, verde = green, amarillo = yellow | La manzana es **roja**. | the white dog |
| 2 | negro | Me gusta el color verde | negro = black, blanco = white, gris = gray, rosa = pink | El cielo es **azul**. | the yellow house |
