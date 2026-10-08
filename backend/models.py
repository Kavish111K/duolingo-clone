import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Date, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship, sessionmaker, declarative_base

# ---------- database setup ----------
# Local default is a file next to the code; on the server DATABASE_URL points to a persistent volume
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./duolingo.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- tables ----------


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    display_name = Column(String, nullable=False)
    avatar_color = Column(String, default="#1CB0F6")
    xp = Column(Integer, default=0)
    gems = Column(Integer, default=500)
    hearts = Column(Integer, default=5)
    hearts_updated_at = Column(DateTime, default=datetime.utcnow)
    streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_active_date = Column(Date, nullable=True)
    daily_goal = Column(Integer, default=20)
    day_offset = Column(Integer, default=0)  # lets us simulate future days for streak testing
    proficiency = Column(Integer, nullable=True)  # 0-4 answer to "How much Spanish do you know?" (null = not asked yet)
    created_at = Column(DateTime, default=datetime.utcnow)


class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True)
    language = Column(String, nullable=False)
    title = Column(String, nullable=False)
    flag = Column(String)
    units = relationship("Unit", back_populates="course", order_by="Unit.position")


class Unit(Base):
    __tablename__ = "units"
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    position = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String)
    color = Column(String)
    course = relationship("Course", back_populates="units")
    skills = relationship("Skill", back_populates="unit", order_by="Skill.position")


class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    position = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    icon = Column(String)
    unit = relationship("Unit", back_populates="skills")
    lessons = relationship("Lesson", back_populates="skill", order_by="Lesson.position")


class Lesson(Base):
    __tablename__ = "lessons"
    id = Column(Integer, primary_key=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    position = Column(Integer, nullable=False)
    skill = relationship("Skill", back_populates="lessons")
    exercises = relationship("Exercise", back_populates="lesson", order_by="Exercise.position")


class Exercise(Base):
    __tablename__ = "exercises"
    id = Column(Integer, primary_key=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    position = Column(Integer, nullable=False)
    # multiple_choice | word_bank | match_pairs | fill_blank | type_answer
    type = Column(String, nullable=False)
    prompt = Column(String, nullable=False)
    data = Column(JSON, nullable=False)  # options / answer / pairs depending on type
    lesson = relationship("Lesson", back_populates="exercises")


class UserSkillProgress(Base):
    __tablename__ = "user_skill_progress"
    __table_args__ = (UniqueConstraint("user_id", "skill_id"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    lessons_completed = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    legendary = Column(Boolean, default=False)  # passed the timed legendary challenge


class LessonCompletion(Base):
    __tablename__ = "lesson_completions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    xp_earned = Column(Integer, nullable=False)
    mistakes = Column(Integer, default=0)
    completed_on = Column(Date, nullable=False)


class Achievement(Base):
    __tablename__ = "achievements"
    id = Column(Integer, primary_key=True)
    key = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String)
    icon = Column(String)
    metric = Column(String, nullable=False)  # xp | streak | lessons
    threshold = Column(Integer, nullable=False)


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    unlocked_at = Column(DateTime, default=datetime.utcnow)
