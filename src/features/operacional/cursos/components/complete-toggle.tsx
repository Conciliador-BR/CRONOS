"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setLessonCompleted } from "../lesson-actions";

/** "Marcar como concluída": otimista; volta ao estado real se falhar. */
export function CompleteToggle({ lessonId, completed }: { lessonId: string; completed: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(completed);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !optimistic;
    startTransition(async () => {
      setOptimistic(next);
      await setLessonCompleted({ lessonId, completed: next });
    });
  }

  return (
    <Button variant={optimistic ? "secondary" : "primary"} onClick={toggle} aria-pressed={optimistic} aria-busy={pending || undefined}>
      {optimistic ? <CheckCircle2 aria-hidden className="text-success" /> : <Circle aria-hidden />}
      {optimistic ? "Concluída" : "Marcar como concluída"}
    </Button>
  );
}
