"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CourseForm } from "./course-form";

export function NewCourseButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        Novo curso
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        closeOnBackdrop={false}
        size="lg"
        title="Novo curso"
        description="Depois de criar, adicione módulos e aulas."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form="new-course-form">Criar curso</Button>
          </>
        }
      >
        {open ? <CourseForm formId="new-course-form" onDone={() => setOpen(false)} /> : null}
      </Modal>
    </>
  );
}
