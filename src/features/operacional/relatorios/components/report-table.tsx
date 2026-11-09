"use client";

import {
  DndContext,
  KeyboardCode,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { positionAtIndex } from "../../shared/position";
import type { PropertyType, ReportProperty, ReportRow } from "../types";
import { Cell } from "./cells/cell";
import { companyDetail } from "./cells/company-cell";
import { columnAnnouncements, columnInstructions, rowAnnouncements, rowInstructions } from "./column-dnd-a11y";
import { PropertyHeader } from "./property-header";
import { PropertyTypeMenu } from "./property-type-menu";
import { SortableRow } from "./sortable-row";
import { inFillRange, useFillHandle } from "./use-fill-handle";
import { isComputedType } from "../options";
import { SortableHeader } from "./sortable-header";
import { useSheet } from "./sheet-context";
import { useSheetCommands } from "./use-sheet-commands";

const DEFAULT_WIDTH: Partial<Record<PropertyType, number>> = {
  company: 240,
  text: 260,
  status: 180,
  select: 170,
  multi_select: 220,
  person: 200,
  date: 150,
  checkbox: 90,
  number: 120,
  id: 70,
};

function widthOf(property: ReportProperty) {
  return property.width ?? DEFAULT_WIDTH[property.type] ?? 180;
}

/** Empresa não repete (uma linha por empresa) e calculadas não têm célula: sem alça de preencher. */
const fillable = (property: ReportProperty) => property.type !== "company" && !isComputedType(property.type);
const isDoneName = (name: string) =>
  name.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase() === "concluido";

const byPosition =(a: { position: number }, b: { position: number }) => a.position - b.position;

/** Tabela estilo banco do Notion: cabeçalho fixo, primeira coluna fixa, rolagem horizontal. */
export function ReportTable() {
  const { state, meta } = useSheet();
  const commands = useSheetCommands();
  const [adding, setAdding] = useState(false);
  const properties = state.properties.toSorted(byPosition);
  const rows = state.rows.toSorted(byPosition);
  const companyColumn = properties.some((property) => property.type === "company");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: [KeyboardCode.Space], cancel: [KeyboardCode.Esc], end: [KeyboardCode.Space, KeyboardCode.Enter] },
    }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const to = properties.findIndex((property) => property.id === over.id);
    if (to < 0) return;
    const rest = properties.filter((property) => property.id !== active.id).map((property) => property.position);
    void commands.moveProperty(String(active.id), positionAtIndex(rest, to));
  }

  // Coluna "Concluído" (Caixa de seleção com esse nome) marcada pinta a linha de verde.
  const doneColumns = properties.filter((property) => property.type === "checkbox" && isDoneName(property.name));
  const fill = useFillHandle(({ propertyId, from, to }) => {
    const source = rows[from];
    const targets = rows.slice(Math.min(from, to), Math.max(from, to) + 1).filter((row) => row.id !== source.id);
    void commands.fillCells(targets.map((row) => row.id), propertyId, source.values[propertyId] ?? null);
  });

  function onRowDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const to = rows.findIndex((row) => row.id === over.id);
    if (to < 0) return;
    const rest = rows.filter((row) => row.id !== active.id).map((row) => row.position);
    void commands.moveRow(String(active.id), positionAtIndex(rest, to));
  }

  function rowLabel(row: ReportRow) {
    const company = companyColumn && row.companyId ? meta.companiesById.get(row.companyId) : undefined;
    return company ? `${company.name} (${companyDetail(company)})` : `Linha ${row.seq}`;
  }

  async function addRow() {
    setAdding(true);
    await commands.addRow();
    setAdding(false);
  }

  // Primeira coluna fixa só a partir de sm: no celular ela tomaria a tela.
  const stickyClass = "bg-surface sm:sticky sm:left-0 sm:z-10 sm:shadow-[1px_0_0_var(--color-border)]";

  return (
    <div className="max-h-[calc(100dvh-14rem)] min-h-48 overflow-auto rounded-xl border border-border bg-surface">
      <DndContext
        id={`sheet-columns-${meta.sheetId}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        accessibility={{ announcements: columnAnnouncements, screenReaderInstructions: columnInstructions }}
      >
      <table className="w-max min-w-full table-fixed border-separate border-spacing-0 text-sm">
        <caption className="sr-only">{state.sheet.name}</caption>
        <colgroup>
          {properties.map((property) => (
            <col key={property.id} style={{ width: widthOf(property) }} />
          ))}
          <col style={{ width: 80 }} />
        </colgroup>
        <thead className="sticky top-0 z-20 bg-surface">
          <tr>
            <SortableContext items={properties.map((property) => property.id)} strategy={horizontalListSortingStrategy}>
              {properties.map((property, index) => (
                <SortableHeader
                  key={property.id}
                  property={property}
                  className={cn("border-b border-border p-0 font-normal", index === 0 ? cn(stickyClass, "sm:z-30") : "border-l")}
                >
                  <PropertyHeader property={property} />
                </SortableHeader>
              ))}
            </SortableContext>
            <th scope="col" className="border-b border-l border-border p-0 font-normal">
              <span className="sr-only">Adicionar propriedade e ações da linha</span>
              <div className="flex justify-center">
                <PropertyTypeMenu />
              </div>
            </th>
          </tr>
        </thead>
        <DndContext
          id={`sheet-rows-${meta.sheetId}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onRowDragEnd}
          // Dentro da <table> o texto de leitor de tela iria parar entre <thead> e <tbody>: vai para o <body>.
          accessibility={{
            announcements: rowAnnouncements,
            screenReaderInstructions: rowInstructions,
            container: typeof document === "undefined" ? undefined : document.body,
          }}
        >
        <tbody>
          <SortableContext items={rows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
          {rows.map((row, rowIndex) => {
            const label = rowLabel(row);
            const done = doneColumns.some((property) => row.values[property.id] === true);
            return (
              <SortableRow key={row.id} rowId={row.id} index={rowIndex} label={label} done={done}>
                {(grip) =>
                  properties.map((property, index) => {
                    const filling = inFillRange(fill.range, property.id, rowIndex);
                    const content = (
                      <>
                        <Cell property={property} row={row} label={`${property.name}, ${label}`} />
                        {fillable(property) ? (
                          <span
                            aria-hidden
                            title="Arraste para copiar para outras linhas"
                            onPointerDown={(event) => fill.start(event, property.id, rowIndex)}
                            className="absolute right-0 bottom-0 z-10 size-2.5 cursor-crosshair rounded-tl-sm bg-ring opacity-0 group-hover/cell:opacity-100"
                          />
                        ) : null}
                      </>
                    );
                    const cellClass = cn("group/cell border-b border-border p-0", filling && "outline-2 -outline-offset-2 outline-ring outline-dashed");
                    return index === 0 ? (
                      <th key={property.id} scope="row" className={cn(cellClass, "relative text-left font-normal", stickyClass)}>
                        {grip}
                        <div className="pl-6">{content}</div>
                      </th>
                    ) : (
                      <td key={property.id} className={cn(cellClass, "relative border-l align-middle")}>
                        {content}
                      </td>
                    );
                  })
                }
              </SortableRow>
            );
          })}
          </SortableContext>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={properties.length + 1} className="px-3 py-6 text-center text-sm text-muted">
                {properties.length === 0
                  ? "Adicione uma propriedade no “+” do cabeçalho e depois uma linha em “Nova linha”."
                  : "Nenhuma linha ainda. Clique em “Nova linha” para adicionar."}
              </td>
            </tr>
          ) : null}
        </tbody>
        </DndContext>
      </table>
      </DndContext>
      <button
        type="button"
        onClick={() => void addRow()}
        disabled={adding}
        className="sticky left-0 flex h-9 items-center gap-2 px-3 text-sm text-muted hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
      >
        {adding ? <Spinner /> : <Plus aria-hidden className="size-4" />}
        Adicionar linha no fim
      </button>
    </div>
  );
}
