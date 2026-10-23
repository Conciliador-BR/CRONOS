"use client";

import { Pencil, Plus, Trash2, Video } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { moveItem } from "../../shared/position";
import { deleteModule, renameModule } from "../course-actions";
import { deleteLesson, reorderLessons } from "../lesson-actions";
import type { CourseModule, Lesson } from "../types";
import { LessonFormModal } from "./lesson-form-modal";
import { ReorderButtons } from "./reorder-buttons";

const SOURCE_LABEL = { upload: "Vídeo enviado", drive: "Google Drive", youtube: "YouTube" } as const;

/** Um módulo no modo de edição: renomear, excluir, aulas (criar, editar, reordenar, excluir). */
export function ModuleEditor({
  courseId,
  module,
  index,
  count,
  onMove,
  onError,
}: {
  courseId: string;
  module: CourseModule;
  index: number;
  count: number;
  onMove: (direction: -1 | 1) => void;
  onError: (message: string | null) => void;
}) {
  const [title, setTitle] = useState(module.title);
  const [editingLesson, setEditingLesson] = useState<Lesson | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  async function run(call: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    const result = await call();
    setBusy(false);
    setConfirm(null);
    onError(result.ok ? null : (result.error ?? "Não foi possível salvar."));
  }

  function rename() {
    const value = title.trim();
    if (!value || value === module.title) return setTitle(module.title);
    void run(() => renameModule({ id: module.id, title: value }));
  }

  function moveLesson(lessonIndex: number, direction: -1 | 1) {
    const ids = moveItem(module.lessons.map((l) => l.id), lessonIndex, lessonIndex + direction);
    void run(() => reorderLessons({ parentId: module.id, ids }));
  }

  return (
    <li className="rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <span className="text-xs text-muted">Módulo {index + 1}</span>
        <Input
          aria-label={`Título do módulo ${index + 1}`}
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={rename}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="h-9 min-w-40 flex-1 font-medium"
        />
        <ReorderButtons label={`módulo ${module.title}`} index={index} count={count} disabled={busy} onMove={onMove} />
        {confirm === module.id ? (
          <span className="flex items-center gap-1">
            <span className="text-xs">Excluir módulo e aulas?</span>
            <Button variant="danger" size="sm" onClick={() => run(() => deleteModule(module.id))}>Excluir</Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirm(null)}>Cancelar</Button>
          </span>
        ) : (
          <Button variant="ghost" size="sm" className="size-8 px-0 hover:text-danger" aria-label={`Excluir módulo ${module.title}`} onClick={() => setConfirm(module.id)}>
            <Trash2 aria-hidden />
          </Button>
        )}
      </div>
      <ol className="divide-y divide-border">
        {module.lessons.map((lesson, lessonIndex) => (
          <li key={lesson.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
            <Video aria-hidden className="size-4 text-muted" />
            <span className="min-w-0 flex-1 truncate text-sm">{lesson.title}</span>
            <Badge>{SOURCE_LABEL[lesson.source]}</Badge>
            <ReorderButtons label={`aula ${lesson.title}`} index={lessonIndex} count={module.lessons.length} disabled={busy} onMove={(d) => moveLesson(lessonIndex, d)} />
            <Button variant="ghost" size="sm" className="size-8 px-0" aria-label={`Editar aula ${lesson.title}`} onClick={() => setEditingLesson(lesson)}>
              <Pencil aria-hidden />
            </Button>
            {confirm === lesson.id ? (
              <span className="flex items-center gap-1">
                <Button variant="danger" size="sm" onClick={() => run(() => deleteLesson(lesson.id))}>Excluir</Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirm(null)}>Cancelar</Button>
              </span>
            ) : (
              <Button variant="ghost" size="sm" className="size-8 px-0 hover:text-danger" aria-label={`Excluir aula ${lesson.title}`} onClick={() => setConfirm(lesson.id)}>
                <Trash2 aria-hidden />
              </Button>
            )}
          </li>
        ))}
      </ol>
      <div className="p-2">
        <Button variant="ghost" size="sm" onClick={() => setEditingLesson("new")}>
          <Plus aria-hidden />
          Adicionar aula
        </Button>
      </div>
      {editingLesson ? (
        <LessonFormModal
          courseId={courseId}
          moduleId={module.id}
          lesson={editingLesson === "new" ? undefined : editingLesson}
          onClose={() => setEditingLesson(null)}
        />
      ) : null}
    </li>
  );
}
