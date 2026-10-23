import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { isManager, requireMember } from "@/lib/auth";
import { getRange, getVisibleDays, parseDay, parseView } from "@/features/operacional/agenda/calendar";
import { CalendarView } from "@/features/operacional/agenda/components/calendar-view";
import { getEventsInRange } from "@/features/operacional/agenda/queries";
import { getActiveMembers } from "@/features/operacional/shared/members";
import { todayKey } from "@/features/operacional/shared/tz";

export const metadata: Metadata = { title: "Agenda" };

export default async function Page(props: PageProps<"/operacional/agenda">) {
  const searchParams = await props.searchParams;
  const today = todayKey();
  const view = parseView(searchParams.visao);
  const day = parseDay(searchParams.data, today);
  const days = getVisibleDays(view, day);
  const { from, to } = getRange(days);
  const [profile, events, members] = await Promise.all([requireMember(), getEventsInRange(from, to), getActiveMembers()]);

  return (
    <>
      <PageHeader title="Agenda" description="Reuniões da equipe. Clique num horário para marcar uma nova." />
      <CalendarView
        view={view}
        day={day}
        today={today}
        days={days}
        events={events}
        members={members}
        meId={profile.id}
        isManager={isManager(profile)}
      />
    </>
  );
}
