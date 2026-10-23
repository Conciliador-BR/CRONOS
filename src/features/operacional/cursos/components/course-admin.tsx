"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { moveItem } from "../../shared/position";
import { createModule, deleteCourse, reorderModules } from "../course-actions";
import type { CourseDetail } from "../types";
import { CourseForm } from "./course-form";
import { ModuleEditor } from "./module-editor";

/** Modo gestor: dados do curso, módulos e aulas, exclusão. */
export function CourseAdmin({ course }: { course: CourseDetail }) {
  const router = useRouter();
  const [moduleTitle, setModuleTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function addModule(event: FormEvent) {
    event.preventDefault();
    const title = moduleTitle.trim();
    if (!title) return;
    setPending(true);
    const result = await createModule({ courseId: course.id, title });
    setPending(false);
    if (!result.ok) return setError(result.error);
    setError(null);
    setModuleTitle("");
  }

  async function moveModule(index: number, direction: -1 | 1) {
    const ids = moveItem(course.modules.map((m) => m.id), index, index + direction);
    const result = await reorderModules({ parentId: course.id, ids });
    setError(result.ok ? null : result.error);
  }

  async function removeCourse() {
    setPending(true);
    const result = await deleteCourse(course.id);
    setPending(false);
    if (!result.ok) return setError(result.error);
    router.push("/operacional/cursos");
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle as="h2">Dados do curso</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseForm key={`${course.title}-${course.published}-${course.coverUrl ? 1 : 0}`} formId="edit-course-form" course={course} />
        </CardContent>
      </Card>
      <section aria-labelledby="modules-title" className="flex flex-col gap-3">
        <h2 id="modules-title" className="text-base font-semibold">Módulos e aulas</h2>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <ol className="flex flex-col gap-3">
          {course.modules.map((module, index) => (
            <ModuleEditor
              key={`${module.id}-${module.title}`}
              courseId={course.id}
              module={module}
              index={index}
              count={course.modules.length}
              onMove={(direction) => moveModule(index, direction)}
              onError={setError}
            />
          ))}
        </ol>
        <form onSubmit={addModule} className="flex gap-2">
          <Input aria-label="Título do novo módulo" placeholder="Novo módulo" maxLength={200} value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} />
          <Button type="submit" variant="secondary" loading={pending}>
            {pending ? null : <Plus aria-hidden />}
            Adicionar módulo
          </Button>
        </form>
      </section>
      <section className="rounded-xl border border-danger/40 p-4">
        <h2 className="mb-1 text-base font-semibold">Excluir curso</h2>
        <p className="mb-3 text-sm text-muted">Remove módulos, aulas, vídeos enviados e o progresso de todos. Não pode ser desfeito.</p>
        {confirmDelete ? (
          <div className="flex gap-2">
            <Button variant="danger" loading={pending} onClick={removeCourse}>Excluir definitivamente</Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Manter</Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Excluir curso</Button>
        )}
      </section>
    </div>
  );
}
