import { getInitials } from "@/lib/nav";
import { cn } from "@/lib/utils";

/** Logo assinada ou iniciais sobre a cor da adquirente (até as logos chegarem). */
export function AcquirerLogo({
  name,
  color,
  logoUrl,
  className,
}: {
  name: string;
  color: string;
  logoUrl: string | null;
  className?: string;
}) {
  if (logoUrl) {
    return (
      <span className={cn("grid place-items-center overflow-hidden rounded-xl bg-white p-3", className)}>
        {/* URL assinada do Storage (muda a cada requisição); next/image exigiria otimizar SVG. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={`Logo ${name}`} className="max-h-full max-w-full object-contain" loading="lazy" decoding="async" />
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label={`Logo ${name} (iniciais)`}
      className={cn("grid place-items-center rounded-xl font-bold tracking-tight text-white", className)}
      style={{ background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 55%, #05070d))` }}
    >
      <span aria-hidden>{getInitials(name)}</span>
    </span>
  );
}
