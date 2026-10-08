"""Duolingo clone API (FastAPI). Run with: uvicorn app:app --reload --port 8000"""
import random
from datetime import date, datetime, timedelta

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import func, and_
from sqlalchemy.orm import Session

import models
from models import get_db
from seed import seed

models.Base.metadata.create_all(bind=models.engine)
seed()  # only inserts data when the database is empty

app = FastAPI(title="Duolingo Clone API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

DEFAULT_USER_ID = 1  # auth is simplified: there is always one logged-in learner
MAX_HEARTS = 5
HEART_REGEN = timedelta(minutes=30)
REFILL_COST = 350
BASE_XP = 10
PERFECT_BONUS = 5
LEGENDARY_XP = 40
MODES = ("normal", "practice", "legendary")  # practice: earns a heart, legendary: timed challenge


class CompleteLessonIn(BaseModel):
    mistakes: int = 0
    mode: str = "normal"


class SettingsIn(BaseModel):
    display_name: str | None = None
    daily_goal: int | None = None
    proficiency: int | None = None  # 0 = new to Spanish ... 4 = can discuss most topics


# ---------- game rules ----------

def today(user: models.User) -> date:
    # day_offset lets us fake "tomorrow" to test streak logic
    return date.today() + timedelta(days=user.day_offset)


def regen_hearts(user: models.User):
    """Give back 1 heart for every 30 minutes passed since the last update."""
    if user.hearts >= MAX_HEARTS:
        return
    gained = int((datetime.utcnow() - user.hearts_updated_at) / HEART_REGEN)
    if gained > 0:
        user.hearts = min(MAX_HEARTS, user.hearts + gained)
        user.hearts_updated_at += gained * HEART_REGEN


def current_streak(user: models.User) -> int:
    """Streak is broken if the learner missed a whole day."""
    if user.last_active_date is None or (today(user) - user.last_active_date).days > 1:
        return 0
    return user.streak


def update_streak(user: models.User):
    t = today(user)
    if user.last_active_date == t:
        return
    if user.last_active_date == t - timedelta(days=1):
        user.streak += 1
    else:
        user.streak = 1
    user.last_active_date = t
    user.longest_streak = max(user.longest_streak, user.streak)


def today_xp(db: Session, user: models.User) -> int:
    total = db.query(func.sum(models.LessonCompletion.xp_earned)).filter(
        models.LessonCompletion.user_id == user.id,
        models.LessonCompletion.completed_on == today(user),
    ).scalar()
    return total or 0


def check_achievements(db: Session, user: models.User) -> list[models.Achievement]:
    """Unlock any achievement whose threshold is now reached. Returns the new ones."""
    lessons = db.query(models.LessonCompletion).filter_by(user_id=user.id).count()
    values = {"xp": user.xp, "streak": user.streak, "lessons": lessons}
    unlocked_ids = {ua.achievement_id for ua in db.query(models.UserAchievement).filter_by(user_id=user.id)}

    new = []
    for ach in db.query(models.Achievement).all():
        if ach.id not in unlocked_ids and values[ach.metric] >= ach.threshold:
            db.add(models.UserAchievement(user_id=user.id, achievement_id=ach.id))
            new.append(ach)
    return new


def skill_statuses(db: Session, user: models.User) -> dict[int, str]:
    """locked / available / completed for every skill. A skill unlocks when the one before it is completed."""
    done = {p.skill_id for p in db.query(models.UserSkillProgress).filter_by(user_id=user.id, completed=True)}
    statuses, prev_done = {}, True  # first skill is always unlocked
    skills = db.query(models.Skill).join(models.Unit).order_by(models.Unit.position, models.Skill.position)
    for skill in skills:
        statuses[skill.id] = "completed" if skill.id in done else "available" if prev_done else "locked"
        prev_done = skill.id in done
    return statuses


# ---------- helpers ----------

def get_current_user(db: Session = Depends(get_db)) -> models.User:
    user = db.get(models.User, DEFAULT_USER_ID)
    regen_hearts(user)
    db.commit()
    return user


def user_stats(db: Session, user: models.User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "avatar_color": user.avatar_color,
        "xp": user.xp,
        "gems": user.gems,
        "hearts": user.hearts,
        "max_hearts": MAX_HEARTS,
        "streak": current_streak(user),
        "longest_streak": user.longest_streak,
        "daily_goal": user.daily_goal,
        "today_xp": today_xp(db, user),
        "joined": user.created_at.date().isoformat(),
        "proficiency": user.proficiency,
    }


# ---------- course & lessons ----------

@app.get("/api/course")
def get_course(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).first()
    statuses = skill_statuses(db, user)
    progress = {p.skill_id: p for p in db.query(models.UserSkillProgress).filter_by(user_id=user.id)}

    units = [{
        "id": unit.id, "position": unit.position, "title": unit.title,
        "description": unit.description, "color": unit.color,
        "skills": [{
            "id": s.id, "title": s.title, "icon": s.icon, "status": statuses[s.id],
            "lessons_completed": progress[s.id].lessons_completed if s.id in progress else 0,
            "total_lessons": len(s.lessons),
            "legendary": s.id in progress and progress[s.id].legendary,
        } for s in unit.skills],
    } for unit in course.units]
    return {"language": course.language, "title": course.title, "flag": course.flag, "units": units}


@app.get("/api/skills/{skill_id}/lesson")
def get_lesson(skill_id: int, mode: str = "normal",
               db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    skill = db.get(models.Skill, skill_id)
    if not skill or mode not in MODES:
        raise HTTPException(404, "Skill not found")
    status = skill_statuses(db, user)[skill_id]
    if status == "locked":
        raise HTTPException(403, "Skill is locked")
    if mode == "legendary" and status != "completed":
        raise HTTPException(403, "Finish the skill first")
    if user.hearts == 0 and mode == "normal":
        raise HTTPException(403, "Out of hearts")

    p = db.query(models.UserSkillProgress).filter_by(user_id=user.id, skill_id=skill_id).first()
    done = p.lessons_completed if p else 0
    # Next unfinished lesson, or a random one when practising / skill already completed
    if mode != "normal" or done >= len(skill.lessons):
        lesson = random.choice(skill.lessons)
    else:
        lesson = skill.lessons[done]

    return {
        "lesson_id": lesson.id,
        "skill_title": skill.title,
        "exercises": [{"id": e.id, "type": e.type, "prompt": e.prompt, "data": e.data} for e in lesson.exercises],
    }


@app.post("/api/lessons/{lesson_id}/complete")
def complete_lesson(lesson_id: int, body: CompleteLessonIn,
                    db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    lesson = db.get(models.Lesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    if body.mode not in MODES:
        raise HTTPException(400, "Unknown mode")
    if body.mode == "legendary" and skill_statuses(db, user)[lesson.skill_id] != "completed":
        raise HTTPException(403, "Finish the skill first")

    if body.mode == "legendary":
        xp = LEGENDARY_XP
    else:
        xp = BASE_XP + (PERFECT_BONUS if body.mistakes == 0 else 0)
    user.xp += xp
    db.add(models.LessonCompletion(user_id=user.id, lesson_id=lesson.id, xp_earned=xp,
                                   mistakes=body.mistakes, completed_on=today(user)))
    update_streak(user)

    if body.mode == "practice":
        user.hearts = min(MAX_HEARTS, user.hearts + 1)  # practising earns a heart back

    # Move skill progress forward (only for the next new lesson, not a repeat)
    progress = db.query(models.UserSkillProgress).filter_by(user_id=user.id, skill_id=lesson.skill_id).first()
    if not progress:
        progress = models.UserSkillProgress(user_id=user.id, skill_id=lesson.skill_id, lessons_completed=0)
        db.add(progress)
    if body.mode == "legendary":
        progress.legendary = True
    elif body.mode == "normal" and not progress.completed and lesson.position == progress.lessons_completed + 1:
        progress.lessons_completed += 1
        progress.completed = progress.lessons_completed >= len(lesson.skill.lessons)

    new_achievements = check_achievements(db, user)
    db.commit()

    return {
        "xp_earned": xp,
        "streak": user.streak,
        "hearts": user.hearts,
        "skill_completed": progress.completed,
        "new_achievements": [{"title": a.title, "icon": a.icon} for a in new_achievements],
    }


# ---------- user, hearts, profile ----------

@app.get("/api/me")
def get_me(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return user_stats(db, user)


@app.post("/api/hearts/lose")
def lose_heart(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    if user.hearts == MAX_HEARTS:
        user.hearts_updated_at = datetime.utcnow()  # regen timer starts now
    user.hearts = max(0, user.hearts - 1)
    db.commit()
    return {"hearts": user.hearts}


@app.post("/api/hearts/refill")
def refill_hearts(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    if user.hearts == MAX_HEARTS:
        raise HTTPException(400, "Hearts are already full")
    if user.gems < REFILL_COST:
        raise HTTPException(400, "Not enough gems")
    user.gems -= REFILL_COST
    user.hearts = MAX_HEARTS
    db.commit()
    return user_stats(db, user)


@app.get("/api/profile")
def get_profile(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    unlocked = {ua.achievement_id for ua in db.query(models.UserAchievement).filter_by(user_id=user.id)}
    achievements = [
        {"key": a.key, "title": a.title, "description": a.description, "icon": a.icon, "unlocked": a.id in unlocked}
        for a in db.query(models.Achievement).order_by(models.Achievement.id)
    ]
    lessons_done = db.query(models.LessonCompletion).filter_by(user_id=user.id).count()
    return {**user_stats(db, user), "lessons_completed": lessons_done, "achievements": achievements}


@app.put("/api/settings")
def update_settings(body: SettingsIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    if body.display_name:
        user.display_name = body.display_name
    if body.daily_goal:
        user.daily_goal = body.daily_goal
    if body.proficiency is not None:
        if not 0 <= body.proficiency <= 4:
            raise HTTPException(400, "Proficiency must be between 0 and 4")
        user.proficiency = body.proficiency
    db.commit()
    return user_stats(db, user)


@app.post("/api/dev/next-day")
def next_day(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    """Testing helper: pretend one day has passed."""
    user.day_offset += 1
    db.commit()
    return user_stats(db, user)


# ---------- leaderboard ----------

@app.get("/api/leaderboard")
def get_leaderboard(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    """Weekly league: XP earned since Monday of the current week."""
    t = today(user)
    week_start = t - timedelta(days=t.weekday())
    weekly_xp = func.coalesce(func.sum(models.LessonCompletion.xp_earned), 0)

    rows = (
        db.query(models.User, weekly_xp.label("weekly_xp"))
        .outerjoin(models.LessonCompletion, and_(
            models.LessonCompletion.user_id == models.User.id,
            models.LessonCompletion.completed_on >= week_start,
        ))
        .group_by(models.User.id)
        .order_by(weekly_xp.desc(), models.User.xp.desc())
        .all()
    )
    return [
        {"rank": i + 1, "id": u.id, "display_name": u.display_name, "avatar_color": u.avatar_color,
         "weekly_xp": xp, "is_me": u.id == user.id}
        for i, (u, xp) in enumerate(rows)
    ]


@app.get("/")
def health():
    return {"status": "ok"}
