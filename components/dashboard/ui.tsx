import type { LucideIcon } from "lucide-react";

/**
 * Primitives du tableau de bord — extrait de flowmerce-web-app
 * (components/dashboard/ui.tsx) : mêmes classes, mêmes jetons. Ne sont repris
 * que les éléments utilisés ici ; ajouter les autres depuis la web-app au
 * besoin plutôt que de les réécrire (monorepo prévu en Phase 5).
 */

export const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

// ── Structure ────────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-[-0.015em] text-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[13px] text-body">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`rounded-card border border-line bg-surface ${padded ? "p-6" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

// ── Statut d'un site ─────────────────────────────────────────────────────────
// Même pastille que StatusBadge (web-app), avec l'échelle des statuts de site.

const SITE_STATUS: Record<string, { label: string; tone: string }> = {
  PUBLISHED: { label: "Publié", tone: "bg-green-50 text-green-800" },
  DRAFT: { label: "Brouillon", tone: "bg-page text-body" },
  SUSPENDED: { label: "Suspendu", tone: "bg-red-50 text-red-800" },
};

export function SiteStatusBadge({ status }: { status: string }) {
  const { label, tone } = SITE_STATUS[status] ?? { label: status, tone: "bg-page text-body" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>
      {label}
    </span>
  );
}

// ── États ────────────────────────────────────────────────────────────────────

export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <span
        aria-hidden
        className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-page text-faint"
      >
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <p className="text-[14px] font-semibold text-ink">{title}</p>
      {hint && <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-body">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
