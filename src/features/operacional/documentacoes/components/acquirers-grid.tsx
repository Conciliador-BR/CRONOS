"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type Active, type Announcements, type DragEndEvent, type Over } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { moveItem, positionAtIndex } from "../../shared/position";
import { moveAcquirer } from "../acquirer-actions";
import type { AcquirerSummary } from "../types";
import { AcquirerFormModal } from "./acquirer-form-modal";
import { AcquirerTile } from "./acquirer-tile";

const title = (item: Active | Over) => String(item.data.current?.title ?? "o card");

const announcements: Announcements = {
  onDragStart: ({ active }) => `Você pegou ${title(active)}.`,
  onDragOver: ({ active, over }) => (over ? `${title(active)} está na posição de ${title(over)}.` : "Fora da grade."),
  onDragEnd: ({ active, over }) => (over ? `${title(active)} foi solto na posição de ${title(over)}.` : `${title(active)} foi solto.`),
  onDragCancel: ({ active }) => `Movimento cancelado. ${title(active)} voltou ao lugar.`,
};

/** Grade de adquirentes; gestores criam, editam e reordenam (arrastando pela alça). */
export function AcquirersGrid({ acquirers, canManage }: { acquirers: AcquirerSummary[]; canManage: boolean }) {
  const [source, setSource] = useState(acquirers);
  const [items, setItems] = useState(acquirers);
  const [editing, setEditing] = useState<AcquirerSummary | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (source !== acquirers) {
    setSource(acquirers);
    setItems(acquirers);
  }
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    const order = moveItem(items, from, to);
    const position = positionAtIndex(order.filter((item) => item.id !== active.id).map((item) => item.position), to);
    const before = items;
    setItems(order.map((item) => (item.id === active.id ? { ...item, position } : item)));
    const result = await moveAcquirer({ id: String(active.id), position });
    if (!result.ok) {
      setItems(before);
      setError(result.error);
    } else setError(null);
  }

  return (
    <>
      {canManage ? (
        <div className="-mt-2 mb-4 flex justify-end">
          <Button onClick={() => setEditing("new")}>
            <Plus aria-hidden />
            Nova adquirente
          </Button>
        </div>
      ) : null}
      {error ? <Alert tone="danger" className="mb-4">{error}</Alert> : null}
      {items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma adquirente cadastrada"
          description={canManage ? "Cadastre a primeira para guardar documentos e notas da API." : "Um gestor ou administrador pode cadastrar as adquirentes."}
          action={canManage ? <Button onClick={() => setEditing("new")}>Nova adquirente</Button> : undefined}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          accessibility={{
            announcements,
            screenReaderInstructions: { draggable: "Pressione Espaço para pegar, setas para mover, Espaço para soltar ou Esc para cancelar." },
          }}
        >
          <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((acquirer) => (
                <AcquirerTile key={acquirer.id} acquirer={acquirer} canManage={canManage} onEdit={() => setEditing(acquirer)} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      {editing ? (
        <AcquirerFormModal acquirer={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />
      ) : null}
    </>
  );
}
