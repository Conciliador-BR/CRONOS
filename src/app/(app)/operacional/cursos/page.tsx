import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { isManager, requireMember } from "@/lib/auth";
import { CoursesGrid } from "@/features/operacional/cursos/components/courses-grid";
import { NewCourseButton } from "@/features/operacional/cursos/components/new-course-button";
import { getCourses } from "@/features/operacional/cursos/queries";

export const metadata: Metadata = { title: "Cursos" };

export default async function Page() {
  const [profile, courses] = await Promise.all([requireMember(), getCourses()]);
  const manager = isManager(profile);
  return (
    <>
      <PageHeader title="Cursos" description="Treinamentos da equipe: assista às aulas e acompanhe seu progresso.">
        {manager ? <NewCourseButton /> : null}
      </PageHeader>
      <CoursesGrid courses={courses} canManage={manager} />
    </>
  );
}
