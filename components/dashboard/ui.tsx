import type { LucideIcon } from "lucide-react";

/**
 * Primitives du tableau de bord — extrait de flowmerce-web-app
 * (components/dashboard/ui.tsx) : mêmes classes, mêmes jetons. Ne sont repris
 * que les éléments utilisés ici ; ajouter les autres depuis la web-app au
 * besoin plutôt que de les réécrire (monorepo prévu en Phase 5).
 */

export const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export const BTN_PRIMARY = `inline-flex items-center justify-center gap-2 rounded-control bg-brand px-4 py-2.5 text-[13px] font-semibold text-on-brand transition-[background-color,transform] hover:bg-brand-dark active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;

export const BTN_GHOST = `inline-flex items-center justify-center gap-2 rounded-control border border-line bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink transition-[border-color,transform] hover:border-brand/40 active:translate-y-px disabled:opacity-50 ${FOCUS}`;

export const FIELD = `w-full rounded-control border border-line bg-surface px-3 py-2 text-[14px] text-ink placeholder:text-faint focus-visible:border-brand ${FOCUS}`;

/** Libellé au-dessus d'un champ (même classe que AUTH_LABEL). */
export const LABEL = "mb-2 block text-[13px] font-semibold text-ink";

/** Aide sous un champ, reliée par aria-describedby. */
export const HINT = "mt-1.5 text-[12px] text-faint";

/** Erreur d'un champ ou d'un formulaire. */
export const FIELD_ERROR = "mt-1.5 text-[13px] font-medium text-red-700";

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

export function CardTitle({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-[13px] font-semibold text-ink">{children}</h2>
      {aside}
    </div>
  );
}

const NOTICE_TONE: Record<"info" | "warning" | "danger", string> = {
  info: "bg-brand-soft text-ink",
  warning: "bg-amber-50 text-amber-900",
  danger: "bg-red-50 text-red-900",
};

export function Notice({
  tone = "info",
  icon: Icon,
  title,
  children,
  action,
}: {
  tone?: "info" | "warning" | "danger";
  icon?: LucideIcon;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div role={tone === "danger" ? "alert" : undefined} className={`rounded-card p-5 ${NOTICE_TONE[tone]}`}>
      <div className="flex items-start gap-3">
        {Icon && <Icon size={17} strokeWidth={1.75} className="mt-px shrink-0" aria-hidden />}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold">{title}</p>
          {children && <div className="mt-1.5 text-[13px] leading-relaxed">{children}</div>}
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
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
