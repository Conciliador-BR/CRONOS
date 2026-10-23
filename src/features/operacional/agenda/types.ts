export type CalendarView = "month" | "week" | "day";

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  meetingUrl: string;
  color: string;
  startsAt: string;
  /** Fim exclusivo. Em "dia inteiro", meia-noite do dia seguinte ao último dia. */
  endsAt: string;
  allDay: boolean;
  createdBy: string | null;
  creatorName: string;
  attendeeIds: string[];
};
