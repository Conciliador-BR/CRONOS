"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ACCENT_COLORS } from "../../shared/colors";
import { ColorPicker } from "../../shared/color-picker";
import { LOGO_MIME_TYPES, MAX_LOGO_BYTES } from "../../shared/files";
import { createAcquirer, deleteAcquirer, removeAcquirerLogo, updateAcquirer, uploadAcquirerLogo } from "../acquirer-actions";
import type { AcquirerSummary } from "../types";
import { AcquirerLogo } from "./acquirer-logo";

type Errors = Record<string, string[] | undefined>;

/** Criar/editar adquirente: nome, cor das iniciais, logo e exclusão. */
export function AcquirerFormModal({ acquirer, onClose }: { acquirer?: AcquirerSummary; onClose: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(acquirer?.name ?? "");
  const [color, setColor] = useState(acquirer?.color ?? ACCENT_COLORS[0].value);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(acquirer?.logoUrl ?? null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState<"save" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function pickFile(next: File | null) {
    if (!next) return;
    if (!LOGO_MIME_TYPES.includes(next.type as (typeof LOGO_MIME_TYPES)[number])) {
      return setErrors({ file: ["Use PNG, JPG, WebP ou SVG."] });
    }
    if (next.size > MAX_LOGO_BYTES) return setErrors({ file: ["A logo pode ter até 2 MB."] });
    setErrors({});
    setFile(next);
    setRemoveLogo(false);
    setPreview(URL.createObjectURL(next));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending("save");
    setFormError(null);
    const saved = acquirer ? await updateAcquirer({ id: acquirer.id, name, color }) : await createAcquirer({ name, color });
    if (!saved.ok) {
      setPending(null);
      setErrors(saved.fieldErrors ?? {});
      return setFormError(saved.error);
    }
    const id = acquirer?.id ?? ("id" in saved && typeof saved.id === "string" ? saved.id : "");
    if (file) {
      const data = new FormData();
      data.set("acquirerId", id);
      data.set("file", file);
      const uploaded = await uploadAcquirerLogo(data);
      if (!uploaded.ok) {
        setPending(null);
        setErrors(uploaded.fieldErrors ?? {});
        return setFormError(`A adquirente foi salva, mas a logo não: ${uploaded.error}`);
      }
    } else if (removeLogo && acquirer?.hasLogo) {
      await removeAcquirerLogo(id);
    }
    setPending(null);
    router.refresh();
    onClose();
  }

  async function remove() {
    if (!acquirer) return;
    setPending("delete");
    const result = await deleteAcquirer(acquirer.id);
    setPending(null);
    if (!result.ok) return setFormError(result.error);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      closeOnBackdrop={false}
      title={acquirer ? "Editar adquirente" : "Nova adquirente"}
      footer={
        <>
          {acquirer && !confirmDelete ? (
            <Button variant="ghost" className="mr-auto hover:text-danger" onClick={() => setConfirmDelete(true)}>
              Excluir
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="acquirer-form" loading={pending === "save"}>
            {pending === "save" ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      <form id="acquirer-form" onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <AcquirerLogo name={name || "?"} color={color} logoUrl={removeLogo ? null : preview} className="size-20 shrink-0 text-2xl" />
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={LOGO_MIME_TYPES.join(",")}
              className="sr-only"
              id="acquirer-logo-file"
              aria-describedby="acquirer-logo-hint"
              onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
            />
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <ImagePlus aria-hidden />
              {preview && !removeLogo ? "Trocar logo" : "Enviar logo"}
            </Button>
            {preview && !removeLogo ? (
              <Button variant="ghost" size="sm" onClick={() => { setRemoveLogo(true); setFile(null); }}>
                <Trash2 aria-hidden />
                Remover logo
              </Button>
            ) : null}
            <p id="acquirer-logo-hint" className={errors.file ? "text-xs font-medium text-danger" : "text-xs text-muted"}>
              {errors.file?.[0] ?? "PNG, JPG, WebP ou SVG até 2 MB. Sem logo, mostramos as iniciais."}
            </p>
          </div>
        </div>
        <Field id="acquirer-name" label="Nome" required error={errors.name}>
          <Input autoFocus maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Cielo" />
        </Field>
        <ColorPicker name="acquirer-color" label="Cor das iniciais" colors={ACCENT_COLORS} value={color} onChange={setColor} />
        {formError ? <Alert tone="danger">{formError}</Alert> : null}
        {confirmDelete ? (
          <Alert tone="warning" title="Excluir esta adquirente?">
            <span>Documentos enviados e notas também serão excluídos. Isso não pode ser desfeito. </span>
            <span className="mt-2 flex gap-2">
              <Button variant="danger" size="sm" loading={pending === "delete"} onClick={remove}>
                Excluir definitivamente
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Manter
              </Button>
            </span>
          </Alert>
        ) : null}
      </form>
    </Modal>
  );
}
