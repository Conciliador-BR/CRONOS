import Link from "next/link";
import { Table2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      icon={Table2}
      title="Tabela não encontrada"
      description="Ela pode ter sido excluída por outra pessoa da equipe."
      action={
        <Link href="/operacional/relatorios" className={buttonVariants({ variant: "secondary" })}>
          Ver tabelas
        </Link>
      }
    />
  );
}
