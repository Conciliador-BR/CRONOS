import { cn } from "@/lib/utils";

type LogoMarkProps = { className?: string; title?: string };

/** Símbolo CRONOS: "C" como mostrador de relógio, índigo com ponteiros ciano sobre preto. */
export function LogoMark({ className, title }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn("size-8 shrink-0", className)}
    >
      <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="12" fill="#05060B" stroke="#303043" strokeWidth="1.5" />
      <path d="M34.6 13.4A15 15 0 1 0 34.6 34.6" stroke="#5B5EE8" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M24 24V15.5M24 24l5 3.5" stroke="#22D3EE" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="24" cy="24" r="2.4" fill="#ECECF5" />
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
