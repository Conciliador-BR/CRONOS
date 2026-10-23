"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { ACCENT_COLORS } from "../../shared/colors";
import { ColorPicker } from "../../shared/color-picker";
import { createEvent, updateEvent } from "../actions";
import { useAgenda, type EventDraft } from "./agenda-context";
import { AttendeePicker } from "./attendee-picker";

type FieldErrors = Record<string, string[] | undefined>;

/** "Nova reunião" / "Editar reunião". */
export function EventFormModal() {
  const { ui, actions } = useAgenda();
  return (
    <Modal
      open={Boolean(ui.draft)}
      onClose={actions.closeForm}
      closeOnBackdrop={false}
      size="lg"
      title={ui.draft?.id ? "Editar reunião" : "Nova reunião"}
      footer={
        <>
          <Button variant="secondary" onClick={actions.closeForm}>
            Cancelar
          </Button>
          <Button type="submit" form="event-form">
            Salvar
          </Button>
        </>
      }
    >
      {ui.draft ? <EventForm key={JSON.stringify(ui.draft)} initial={ui.draft} /> : null}
    </Modal>
  );
}

function EventForm({ initial }: { initial: EventDraft }) {
  const { meta, actions } = useAgenda();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const set = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => setValues((v) => ({ ...v, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    const { id, ...input } = values;
    const result = id ? await updateEvent(id, input) : await createEvent(input);
    setPending(false);
    if (result.ok) return actions.closeForm();
    setErrors(result.fieldErrors ?? {});
    setFormError(result.error);
  }

  return (
    <form id="event-form" onSubmit={submit} className="flex flex-col gap-4" aria-busy={pending}>
      <Field id="event-title" label="Título" required error={errors.title}>
        <Input autoFocus maxLength={200} value={values.title} onChange={(e) => set("title", e.target.value)} placeholder="Adicionar título" />
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={values.allDay} onChange={(e) => set("allDay", e.target.checked)} className="size-4 accent-[var(--primary)]" />
        Dia inteiro
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Field id="event-start-day" label="Início" required error={errors.startDay}>
            <Input type="date" value={values.startDay} onChange={(e) => set("startDay", e.target.value)} />
          </Field>
          {values.allDay ? null : (
            <Field id="event-start-time" label={<span className="sr-only">Hora de início</span>} error={errors.startTime}>
              <Input type="time" value={values.startTime} onChange={(e) => set("startTime", e.target.value)} className="mt-[1.375rem] w-28" />
            </Field>
          )}
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Field id="event-end-day" label="Fim" required error={errors.endDay ?? (values.allDay ? errors.endTime : undefined)}>
            <Input type="date" value={values.endDay} onChange={(e) => set("endDay", e.target.value)} />
          </Field>
          {values.allDay ? null : (
            <Field id="event-end-time" label={<span className="sr-only">Hora de término</span>} error={errors.endTime}>
              <Input type="time" value={values.endTime} onChange={(e) => set("endTime", e.target.value)} className="mt-[1.375rem] w-28" />
            </Field>
          )}
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted">Horário de Brasília.</p>
      <Field id="event-location" label="Local" error={errors.location}>
        <Input maxLength={300} value={values.location} onChange={(e) => set("location", e.target.value)} placeholder="Sala, endereço…" />
      </Field>
      <Field id="event-url" label="Link da reunião" hint="Google Meet, Zoom, Teams… (https://)" error={errors.meetingUrl}>
        <Input type="url" inputMode="url" value={values.meetingUrl} onChange={(e) => set("meetingUrl", e.target.value)} placeholder="https://meet.google.com/…" />
      </Field>
      <Field id="event-description" label="Descrição" error={errors.description}>
        <Textarea rows={3} maxLength={5000} value={values.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <ColorPicker name="event-color" label="Cor" colors={ACCENT_COLORS} value={values.color} onChange={(c) => set("color", c)} />
      <AttendeePicker members={meta.members} value={values.attendeeIds} onChange={(ids) => set("attendeeIds", ids)} />
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      {pending ? <p className="sr-only" role="status">Salvando…</p> : null}
    </form>
  );
}
