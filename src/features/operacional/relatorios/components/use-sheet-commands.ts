"use client";

import { createProperty, deleteProperty, reorderProperty, setCompanySync, updateProperty } from "../property-actions";
import { createRow, deleteRow, fillCells, reorderRow, setCell, setRowCompany } from "../row-actions";
import { resetWeek, updateSheet } from "../sheet-actions";
import type { CellValue, PropertyOption, PropertyType, ReportRow } from "../types";
import { useSheet, type SheetState } from "./sheet-context";

const OFFLINE = "Sem conexão com o servidor. Tente novamente.";

function patchRow(state: SheetState, rowId: string, change: (row: ReportRow) => ReportRow): SheetState {
  return { ...state, rows: state.rows.map((row) => (row.id === rowId ? change(row) : row)) };
}

/**
 * Comandos da tabela: otimistas quando dá, desfeitos se a Server Action falhar.
 * Todos devolvem a mensagem de erro, ou null se deu certo. `report: false` deixa o erro
 * para quem chamou mostrar (ex.: dentro de um modal).
 */
export function useSheetCommands() {
  const { meta, actions } = useSheet();
  const sheetId = meta.sheetId;

  async function call<T extends { ok: boolean; error?: string }>(
    run: () => Promise<T>,
    report: boolean,
  ): Promise<{ result: T | null; error: string | null }> {
    if (report) actions.reportError(null);
    let result: T | null = null;
    let error: string | null;
    try {
      result = await run();
      error = result.ok ? null : (result.error ?? OFFLINE);
    } catch {
      error = OFFLINE;
    }
    if (error && report) actions.reportError(error);
    return { result, error };
  }

  return {
    async addRow() {
      const { result, error } = await call(() => createRow({ sheetId }), true);
      if (result?.ok) {
        const row = result.row;
        actions.apply((state) => ({ ...state, rows: [...state.rows, row] }));
      }
      return error;
    },

    deleteRow(id: string, report = true) {
      return actions.mutate(
        (state) => ({ ...state, rows: state.rows.filter((row) => row.id !== id) }),
        () => deleteRow({ id, sheetId }),
        report,
      );
    },

    setCell(rowId: string, propertyId: string, value: CellValue | null) {
      return actions.mutate(
        (state) =>
          patchRow(state, rowId, (row) => {
            const values = { ...row.values };
            if (value === null) delete values[propertyId];
            else values[propertyId] = value;
            return { ...row, values };
          }),
        () => setCell({ sheetId, rowId, propertyId, value }),
      );
    },

    fillCells(rowIds: string[], propertyId: string, value: CellValue | null) {
      if (rowIds.length === 0) return Promise.resolve(null);
      const ids = new Set(rowIds);
      return actions.mutate(
        (state) => ({
          ...state,
          rows: state.rows.map((row) => {
            if (!ids.has(row.id)) return row;
            const values = { ...row.values };
            if (value === null) delete values[propertyId];
            else values[propertyId] = value;
            return { ...row, values };
          }),
        }),
        () => fillCells({ sheetId, rowIds, propertyId, value }),
      );
    },

    /** Só admin (o servidor confere): todo Status volta para a primeira opção "A fazer". */
    resetWeek(report = true) {
      return actions.mutate(
        (state) => {
          const statuses = state.properties.filter((property) => property.type === "status");
          return {
            ...state,
            rows: state.rows.map((row) => {
              const values = { ...row.values };
              for (const property of statuses) {
                const todo = property.options.find((option) => option.group === "todo");
                if (todo) values[property.id] = todo.id;
                else delete values[property.id];
              }
              return { ...row, values };
            }),
          };
        },
        () => resetWeek({ sheetId }),
        report,
      );
    },

    setRowCompany(rowId: string, companyId: string | null) {
      return actions.mutate(
        (state) => patchRow(state, rowId, (row) => ({ ...row, companyId })),
        () => setRowCompany({ sheetId, rowId, companyId }),
      );
    },

    async addProperty(name: string, type: PropertyType, autoAddCompanies?: boolean, report = true) {
      const { result, error } = await call(() => createProperty({ sheetId, name, type, autoAddCompanies }), report);
      if (result?.ok) {
        const property = result.property;
        actions.apply((state) => ({
          ...state,
          sheet: type === "company" && autoAddCompanies !== undefined ? { ...state.sheet, autoAddCompanies } : state.sheet,
          properties: [...state.properties, property],
        }));
      }
      return error;
    },

    updateProperty(id: string, patch: { name?: string; options?: PropertyOption[] }, report = true) {
      return actions.mutate(
        (state) => ({
          ...state,
          properties: state.properties.map((property) => (property.id === id ? { ...property, ...patch } : property)),
        }),
        () => updateProperty({ id, sheetId, ...patch }),
        report,
      );
    },

    moveProperty(id: string, position: number) {
      return actions.mutate(
        (state) => ({
          ...state,
          properties: state.properties.map((property) => (property.id === id ? { ...property, position } : property)),
        }),
        () => reorderProperty({ id, sheetId, position }),
      );
    },

    moveRow(id: string, position: number) {
      return actions.mutate(
        (state) => patchRow(state, id, (row) => ({ ...row, position })),
        () => reorderRow({ id, sheetId, position }),
      );
    },

    deleteProperty(id: string, report = true) {
      return actions.mutate(
        (state) => ({ ...state, properties: state.properties.filter((property) => property.id !== id) }),
        () => deleteProperty({ id, sheetId }),
        report,
      );
    },

    setCompanySync(enabled: boolean) {
      return actions.mutate(
        (state) => ({ ...state, sheet: { ...state.sheet, autoAddCompanies: enabled } }),
        () => setCompanySync({ sheetId, enabled }),
      );
    },

    updateSheet(patch: { name?: string; description?: string }) {
      return actions.mutate(
        (state) => ({ ...state, sheet: { ...state.sheet, ...patch } }),
        () => updateSheet({ id: sheetId, ...patch }),
      );
    },
  };
}
