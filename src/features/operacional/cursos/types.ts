export type VideoSource = "upload" | "drive" | "youtube";

export type CourseCard = {
  id: string;
  title: string;
  description: string;
  published: boolean;
  coverUrl: string | null;
  moduleCount: number;
  lessonCount: number;
  completedCount: number;
};

export type Lesson = {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  source: VideoSource;
  videoUrl: string | null;
  videoPath: string | null;
  position: number;
};

export type CourseModule = { id: string; title: string; position: number; lessons: Lesson[] };

export type CourseDetail = {
  id: string;
  title: string;
  description: string;
  published: boolean;
  coverUrl: string | null;
  hasCover: boolean;
  modules: CourseModule[];
  completedIds: string[];
};
