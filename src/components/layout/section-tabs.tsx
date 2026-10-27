"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath, type NavLink } from "@/lib/nav";
import { cn } from "@/lib/utils";

/** Abas de navegação entre subpáginas de uma seção (links, não tablist). */
export function SectionTabs({ label, items }: { label: string; items: readonly NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-border">
        {items.map(({ href, label: itemLabel }) => {
          const active = isActivePath(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px block border-b-2 px-4 py-2.5 text-sm transition-colors",
                  active
                    ? "border-primary font-medium text-fg"
                    : "border-transparent text-muted hover:border-border hover:text-fg",
                )}
              >
                {itemLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
