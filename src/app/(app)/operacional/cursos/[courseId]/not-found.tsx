import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      icon={GraduationCap}
      title="Curso ou aula não encontrado"
      description="Ele pode ter sido removido ou ainda não foi publicado."
      action={
        <Link href="/operacional/cursos" className={buttonVariants({ variant: "secondary" })}>
          Ver cursos
        </Link>
      }
    />
  );
}
