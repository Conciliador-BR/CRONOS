"use client";

import { createContext, use, useState, type ReactNode } from "react";
import type { Member } from "../../shared/types";
import type { CalendarEvent } from "../types";

/** Valores iniciais do formulário (horário de Brasília). */
export type EventDraft = {
  id?: string;
  title: string;
  description: string;
  location: string;
  meetingUrl: string;
  color: string;
  allDay: boolean;
  startDay: string;
  startTime: string;
  endDay: string;
  endTime: string;
  attendeeIds: string[];
};

type AgendaContextValue = {
  meta: { members: Member[]; membersById: Map<string, Member>; meId: string; isManager: boolean };
  ui: { draft: EventDraft | null; selected: CalendarEvent | null };
  actions: {
    openNew: (draft: EventDraft) => void;
    openEdit: (draft: EventDraft) => void;
    closeForm: () => void;
    select: (event: CalendarEvent | null) => void;
    canEdit: (event: CalendarEvent) => boolean;
  };
};

const AgendaContext = createContext<AgendaContextValue | null>(null);

export function useAgenda() {
  const value = use(AgendaContext);
  if (!value) throw new Error("useAgenda fora do AgendaProvider");
  return value;
}

export function AgendaProvider({
  members,
  meId,
  isManager,
  children,
}: {
  members: Member[];
  meId: string;
  isManager: boolean;
  children: ReactNode;
}) {
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  return (
    <AgendaContext
      value={{
        meta: { members, membersById: new Map(members.map((m) => [m.id, m])), meId, isManager },
        ui: { draft, selected },
        actions: {
          openNew: (value) => {
            setSelected(null);
            setDraft(value);
          },
          openEdit: (value) => {
            setSelected(null);
            setDraft(value);
          },
          closeForm: () => setDraft(null),
          select: setSelected,
          canEdit: (event) => isManager || event.createdBy === meId,
        },
      }}
    >
      {children}
    </AgendaContext>
  );
}
