export interface Me {
  id: number;
  username: string;
  display_name: string;
  avatar_color: string;
  xp: number;
  gems: number;
  hearts: number;
  max_hearts: number;
  streak: number;
  longest_streak: number;
  daily_goal: number;
  today_xp: number;
  joined: string;
  proficiency: number | null; // answer to "How much Spanish do you know?"
}

export interface Skill {
  id: number;
  title: string;
  icon: string;
  status: "locked" | "available" | "completed";
  lessons_completed: number;
  total_lessons: number;
  legendary: boolean;
}

export interface Unit {
  id: number;
  position: number;
  title: string;
  description: string;
  color: string;
  skills: Skill[];
}

export interface Course {
  language: string;
  title: string;
  flag: string;
  units: Unit[];
}

export type LessonMode = "normal" | "practice" | "legendary";

export type ExerciseType = "multiple_choice" | "word_bank" | "match_pairs" | "fill_blank" | "type_answer";

export interface Exercise {
  id: number;
  type: ExerciseType;
  prompt: string;
  // shape depends on type, see backend/seed.py
  data: {
    answer?: string;
    options?: string[];
    emojis?: string[] | null;
    sentence?: string;
    words?: string[];
    pairs?: [string, string][];
  };
}

export interface LessonData {
  lesson_id: number;
  skill_title: string;
  exercises: Exercise[];
}

export interface LessonResult {
  xp_earned: number;
  streak: number;
  hearts: number;
  skill_completed: boolean;
  new_achievements: { title: string; icon: string }[];
}

export interface LeaderboardRow {
  rank: number;
  id: number;
  display_name: string;
  avatar_color: string;
  weekly_xp: number;
  is_me: boolean;
}

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface Profile extends Me {
  lessons_completed: number;
  achievements: Achievement[];
}
