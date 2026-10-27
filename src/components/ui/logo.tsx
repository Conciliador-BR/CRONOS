import { cn } from "@/lib/utils";

type LogoMarkProps = { className?: string; title?: string };

/** Símbolo CRONOS: um "C" em forma de mostrador de relógio, azul sobre preto. */
export function LogoMark({ className, title }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn("size-8 shrink-0", className)}
    >
      <rect x="0.5" y="0.5" width="31" height="31" rx="8" fill="#05070D" stroke="#1E2A4A" />
      <path
        d="M23.07 8.93A10 10 0 1 0 23.07 23.07"
        stroke="#2563EB"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path d="M16 16V10.5M16 16l3.5 2.5" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="16" r="1.75" fill="#E6ECFF" />
    </svg>
  );
}

type LogoProps = {
  className?: string;
  /** "full": símbolo + nome; "mark": só o símbolo (com nome acessível). */
  variant?: "full" | "mark";
};

export function Logo({ className, variant = "full" }: LogoProps) {
  if (variant === "mark") return <LogoMark className={className} title="CRONOS" />;
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-lg font-semibold tracking-[0.18em] text-fg">
        CRON<span className="text-primary">O</span>S
      </span>
    </span>
  );
}
