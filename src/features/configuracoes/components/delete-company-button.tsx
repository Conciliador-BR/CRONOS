"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCompany } from "../company-actions";
import { ConfirmDialog } from "./confirm-dialog";

export function DeleteCompanyButton({ companyId, name }: { companyId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        <Trash2 aria-hidden />
        Excluir empresa
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Excluir empresa?"
        description={`“${name}” será excluída com os ECs, as contas bancárias e os PDFs. O cliente vinculado continua cadastrado.`}
        confirmLabel="Excluir empresa"
        pendingLabel="Excluindo…"
        onConfirm={async () => {
          const result = await deleteCompany(companyId);
          if (result.ok) router.push("/configuracoes/empresas");
          return result;
        }}
      />
    </>
  );
}
