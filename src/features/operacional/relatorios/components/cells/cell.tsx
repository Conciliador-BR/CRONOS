"use client";

import { isComputedType } from "../../options";
import type { CellValue, ReportProperty, ReportRow } from "../../types";
import { readCellValue } from "../../values";
import { useSheetCommands } from "../use-sheet-commands";
import { CompanyCell } from "./company-cell";
import { ComputedCell } from "./computed-cell";
import { DateCell } from "./date-cell";
import { OptionCell } from "./option-cell";
import { PersonCell } from "./person-cell";
import { TextCell } from "./text-cell";

/** Escolhe o editor da célula pelo tipo da coluna. `label` nomeia o campo para leitores de tela. */
export function Cell({ property, row, label }: { property: ReportProperty; row: ReportRow; label: string }) {
  const commands = useSheetCommands();
  const { type } = property;

  if (type === "company") {
    return <CompanyCell companyId={row.companyId} label={label} onCommit={(id) => void commands.setRowCompany(row.id, id)} />;
  }
  if (isComputedType(type)) return <ComputedCell type={type} row={row} />;

  const value = readCellValue(type, row.values[property.id], property.options);
  const commit = (next: CellValue | null) => void commands.setCell(row.id, property.id, next);

  switch (type) {
    case "select":
    case "multi_select":
    case "status":
      return <OptionCell property={property} value={value} label={label} onCommit={commit} />;
    case "person":
      return <PersonCell value={value} label={label} onCommit={commit} />;
    case "checkbox":
      return (
        <span className="flex h-9 items-center px-2">
          <input
            type="checkbox"
            aria-label={label}
            checked={value === true}
            onChange={(event) => commit(event.target.checked ? true : null)}
            className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        </span>
      );
    case "date":
      return <DateCell value={typeof value === "string" ? value : null} label={label} onCommit={commit} />;
    default:
      return <TextCell type={type} value={value} label={label} onCommit={commit} />;
  }
}
