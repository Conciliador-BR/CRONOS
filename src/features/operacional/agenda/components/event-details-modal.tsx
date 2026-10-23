"use client";

import { AlignLeft, CalendarClock, MapPin, Trash2, Users, Video } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Modal } from "@/components/ui/modal";
import { formatLongDate, formatTime, wallParts } from "../../shared/tz";
import { deleteEvent } from "../actions";
import { addDaysToKey } from "../calendar";
import type { CalendarEvent } from "../types";
import { useAgenda } from "./agenda-context";
import { draftFromEvent } from "./drafts";
import { wallToIso } from "../../shared/tz";

function describeWhen(event: CalendarEvent) {
  if (event.allDay) {
    const lastDay = addDaysToKey(wallParts(event.endsAt).dayKey, -1);
    const first = formatLongDate(event.startsAt);
    const last = formatLongDate(wallToIso(lastDay, "12:00"));
    return first === last ? `${first} · dia inteiro` : `${first} até ${last}`;
  }
  const sameDay = wallParts(event.startsAt).dayKey === wallParts(event.endsAt).dayKey;
  return sameDay
    ? `${formatLongDate(event.startsAt)} · ${formatTime(event.startsAt)} – ${formatTime(event.endsAt)}`
    : `${formatLongDate(event.startsAt)}, ${formatTime(event.startsAt)} – ${formatLongDate(event.endsAt)}, ${formatTime(event.endsAt)}`;
}

/** Detalhes da reunião; editar/excluir só para quem criou ou gestor. */
export function EventDetailsModal() {
  const { ui, meta, actions } = useAgenda();
  const event = ui.selected;
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editable = event ? actions.canEdit(event) : false;

  function close() {
    setConfirming(false);
    setError(null);
    actions.select(null);
  }

  async function remove() {
    if (!event) return;
    setPending(true);
    const result = await deleteEvent(event.id);
    setPending(false);
    if (!result.ok) return setError(result.error);
    close();
  }

  return (
    <Modal
      open={Boolean(event)}
      onClose={close}
      title={
        event ? (
          <span className="flex items-start gap-3">
            <span aria-hidden className="mt-1.5 size-3.5 shrink-0 rounded" style={{ backgroundColor: event.color }} />
            <span className="break-words">{event.title}</span>
          </span>
        ) : (
          "Reunião"
        )
      }
      description={event ? <span className="first-letter:uppercase">{describeWhen(event)}</span> : undefined}
      footer={
        editable && event ? (
          confirming ? (
            <>
              <span className="mr-auto text-sm text-fg">Excluir esta reunião para todos?</span>
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                Manter
              </Button>
              <Button variant="danger" loading={pending} onClick={remove}>
                Excluir
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="mr-auto hover:text-danger" onClick={() => setConfirming(true)}>
                <Trash2 aria-hidden />
                Excluir
              </Button>
              <Button onClick={() => actions.openEdit(draftFromEvent(event))}>Editar</Button>
            </>
          )
        ) : undefined
      }
    >
      {event ? (
        <div className="flex flex-col gap-4 text-sm">
          {event.meetingUrl ? (
            <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ className: "self-start" })}>
              <Video aria-hidden />
              Entrar na reunião
            </a>
          ) : null}
          {event.location ? (
            <p className="flex items-start gap-3">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
              <span className="break-words">{event.location}</span>
            </p>
          ) : null}
          {event.description ? (
            <p className="flex items-start gap-3">
              <AlignLeft aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
              <span className="break-words whitespace-pre-wrap">{event.description}</span>
            </p>
          ) : null}
          <div className="flex items-start gap-3">
            <Users aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
            {event.attendeeIds.length === 0 ? (
              <span className="text-muted">Sem convidados</span>
            ) : (
              <ul className="flex flex-col gap-1.5" aria-label="Convidados">
                {event.attendeeIds.map((id) => {
                  const member = meta.membersById.get(id);
                  return (
                    <li key={id} className="flex items-center gap-2">
                      <Avatar name={member?.name ?? "Funcionário inativo"} src={member?.avatarUrl} size="xs" />
                      {member?.name ?? "Funcionário inativo"}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <p className="flex items-center gap-3 text-muted">
            <CalendarClock aria-hidden className="size-4 shrink-0" />
            Criada por {event.creatorName}
          </p>
          {!editable ? <p className="text-xs text-muted">Só quem criou a reunião ou um gestor pode editá-la.</p> : null}
          {error ? <Alert tone="danger">{error}</Alert> : null}
        </div>
      ) : null}
    </Modal>
  );
}
