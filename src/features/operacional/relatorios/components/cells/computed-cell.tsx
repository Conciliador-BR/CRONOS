import { Avatar } from "@/components/ui/avatar";
import { formatShortDate, formatTime } from "../../../shared/tz";
import type { PropertyType, ReportRow } from "../../types";
import { useSheet } from "../sheet-context";

/** ID, Criado em, Última edição, Criado por e Última edição por: somente leitura. */
export function ComputedCell({ type, row }: { type: PropertyType; row: ReportRow }) {
  const { meta } = useSheet();

  if (type === "id") return <span className="block px-2 text-sm text-muted tabular-nums">{row.seq}</span>;

  if (type === "created_time" || type === "last_edited_time") {
    const at = type === "created_time" ? row.createdAt : row.updatedAt;
    return (
      <time dateTime={at} className="block truncate px-2 text-sm text-muted">
        {formatShortDate(at)}, {formatTime(at)}
      </time>
    );
  }

  const memberId = type === "created_by" ? row.createdBy : row.updatedBy;
  const member = memberId ? meta.membersById.get(memberId) : undefined;
  if (!member) return <span className="block px-2 text-sm text-muted/60">—</span>;
  return (
    <span className="flex min-w-0 items-center gap-1.5 px-2 text-sm">
      <Avatar name={member.name} src={member.avatarUrl} size="xs" />
      <span className="truncate">{member.name}</span>
    </span>
  );
}
