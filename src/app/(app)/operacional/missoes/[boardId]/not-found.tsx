import Link from "next/link";
import { KanbanSquare } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      icon={KanbanSquare}
      title="Quadro não encontrado"
      description="Ele pode ter sido excluído por outra pessoa da equipe."
      action={
        <Link href="/operacional/missoes" className={buttonVariants({ variant: "secondary" })}>
          Ver quadros
        </Link>
      }
    />
  );
}
