"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ReportSheetData } from "../types";
import { DeleteDialog, STABLE_FOCUS_ID } from "./delete-dialog";
import { ProgressPanel } from "./progress-panel";
import { ReportTable } from "./report-table";
import { SheetHeader } from "./sheet-header";
import { SheetProvider, useSheet } from "./sheet-context";
import { useSheetCommands } from "./use-sheet-commands";

/** Tela da tabela: cabeçalho editável, aviso de erro, painel de progresso e tabela. */
export function SheetView({ data }: { data: ReportSheetData }) {
  return (
    <SheetProvider data={data}>
      <div className="flex flex-col gap-4">
        <SheetHeader />
        <SheetError />
        <ProgressPanel />
        <Toolbar />
        <ReportTable />
      </div>
      <DeleteDialog />
    </SheetProvider>
  );
}

function Toolbar() {
  const { state } = useSheet();
  const commands = useSheetCommands();
  const [adding, setAdding] = useState(false);
  const count = state.rows.length;

  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm text-muted" aria-live="polite">
        {count} {count === 1 ? "linha" : "linhas"}
      </p>
      <Button
        id={STABLE_FOCUS_ID}
        size="sm"
        loading={adding}
        onClick={() => {
          setAdding(true);
          void commands.addRow().finally(() => setAdding(false));
        }}
      >
        {adding ? null : <Plus aria-hidden />}
        Nova linha
      </Button>
    </div>
  );
}

function SheetError() {
  const { ui, actions } = useSheet();
  if (!ui.error) return null;
  return (
    <Alert tone="danger" title="A mudança não foi salva">
      <span>{ui.error} </span>
      <button type="button" className="underline" onClick={() => actions.reportError(null)}>
        Fechar aviso
      </button>
    </Alert>
  );
}
