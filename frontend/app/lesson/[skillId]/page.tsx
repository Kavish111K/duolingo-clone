import LessonPlayer from "@/components/LessonPlayer";
import { LessonMode } from "@/lib/types";

export default async function LessonPage({ params, searchParams }: {
  params: Promise<{ skillId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { skillId } = await params;
  const { mode } = await searchParams;
  const lessonMode: LessonMode = mode === "practice" || mode === "legendary" ? mode : "normal";
  // key makes React start a fresh player when the mode changes
  return <LessonPlayer key={`${skillId}-${lessonMode}`} skillId={Number(skillId)} mode={lessonMode} />;
}
