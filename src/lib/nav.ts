import {
  Briefcase,
  Building2,
  House,
  Megaphone,
  Settings,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";

export type AppRole = Database["public"]["Enums"]["app_role"];

/** Link simples (abas e menus de seção). Serializável: pode ir do servidor para o cliente. */
export type NavLink = { href: string; label: string };

/** Item do menu lateral. `managerOnly` esconde o item de quem não é admin/gestor. */
export type MainNavItem = NavLink & { icon: LucideIcon; managerOnly?: true };

export const MAIN_NAV: readonly MainNavItem[] = [
  { href: "/inicio", label: "Início", icon: House },
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/operacional", label: "Operacional", icon: Briefcase },
  { href: "/comercial", label: "Comercial", icon: TrendingUp },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/configuracoes", label: "Configurações", icon: Settings, managerOnly: true },
];

export const OPERACIONAL_NAV: readonly NavLink[] = [
  { href: "/operacional/missoes", label: "Missões" },
  { href: "/operacional/agenda", label: "Agenda" },
  { href: "/operacional/documentacoes", label: "Documentações de API" },
  { href: "/operacional/cursos", label: "Cursos" },
];

export const COMERCIAL_NAV: readonly NavLink[] = [
  { href: "/comercial/desempenho", label: "Desempenho" },
  { href: "/comercial/crm", label: "CRM" },
  { href: "/comercial/insights", label: "Insights" },
];

export const CONFIGURACOES_NAV: readonly NavLink[] = [
  { href: "/configuracoes/empresas", label: "Empresas" },
  { href: "/configuracoes/funcionarios", label: "Funcionários" },
  { href: "/configuracoes/times", label: "Times" },
];

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  gestor: "Gestor",
  funcionario: "Funcionário",
};

export function canManage(role: AppRole) {
  return role === "admin" || role === "gestor";
}

/** Itens do menu lateral visíveis para o papel. */
export function getMainNav(role: AppRole) {
  const manager = canManage(role);
  return MAIN_NAV.filter((item) => manager || !item.managerOnly);
}

/** Ativo quando a rota é o próprio href ou uma subrota dele. */
export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Iniciais para o avatar: primeira letra do primeiro e do último nome. */
export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}
