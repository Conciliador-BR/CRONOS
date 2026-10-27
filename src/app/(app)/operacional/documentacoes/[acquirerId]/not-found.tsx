import Link from "next/link";
import { FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      icon={FileText}
      title="Adquirente não encontrada"
      description="Ela pode ter sido excluída por um gestor."
      action={
        <Link href="/operacional/documentacoes" className={buttonVariants({ variant: "secondary" })}>
          Ver adquirentes
        </Link>
      }
    />
  );
}
