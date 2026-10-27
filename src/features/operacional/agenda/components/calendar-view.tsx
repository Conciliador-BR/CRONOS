"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Member } from "../../shared/types";
import type { CalendarEvent, CalendarView as View } from "../types";
import { AgendaProvider, useAgenda } from "./agenda-context";
import { CalendarToolbar } from "./calendar-toolbar";
import { newDraft } from "./drafts";
import { EventDetailsModal } from "./event-details-modal";
import { EventFormModal } from "./event-form-modal";
import { MonthGrid } from "./month-grid";
import { TimeGrid } from "./time-grid";

type Props = {
  view: View;
  day: string;
  today: string;
  days: string[];
  events: CalendarEvent[];
  members: Member[];
  meId: string;
  isManager: boolean;
};

/** Agenda estilo Google: grade do período + formulário e detalhes em modais. */
export function CalendarView({ members, meId, isManager, ...grid }: Props) {
  return (
    <AgendaProvider members={members} meId={meId} isManager={isManager}>
      <CalendarBody {...grid} />
      <EventFormModal />
      <EventDetailsModal />
    </AgendaProvider>
  );
}

function CalendarBody({ view, day, today, days, events }: Omit<Props, "members" | "meId" | "isManager">) {
  const { actions } = useAgenda();
  return (
    <>
      <CalendarToolbar
        view={view}
        day={day}
        today={today}
        action={
          <Button size="sm" onClick={() => actions.openNew(newDraft(view === "month" ? today : day))}>
            <Plus aria-hidden />
            Nova reunião
          </Button>
        }
      />
      {view === "month" ? (
        <MonthGrid days={days} month={day.slice(0, 7)} today={today} events={events} />
      ) : (
        <TimeGrid days={days} today={today} events={events} />
      )}
    </>
  );
}
