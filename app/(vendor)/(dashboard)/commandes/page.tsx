// « Commandes » — toutes les commandes du vendeur, la plus récente d'abord (§2.4).

import type { OrderStatus } from "@prisma/client";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, ShoppingBag } from "lucide-react";
import { BTN_GHOST, Card, EmptyState, FOCUS, OrderStatusBadge, PageHeader } from "@/components/dashboard/ui";
import { auth } from "@/lib/auth";
import { formatDA } from "@/lib/money";
import { listOrdersForOwner } from "@/lib/orders/manage";
import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import { formatAlgerianPhone } from "@/lib/phone";
import { listSitesForOwner } from "@/lib/sites";
import { filtersQuery, parseOrderFilters, type OrderSearchParams } from "./filters";

const STATUS_ORDER: OrderStatus[] = ["NEW", "CONFIRMED", "SHIPPED", "DELIVERED", "RETURNED", "CANCELLED"];
const DATE = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Algiers" });

const CHIP = `inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors ${FOCUS}`;
const chip = (active: boolean) => `${CHIP} ${active ? "border-brand bg-brand-soft text-brand-ink" : "border-line bg-surface text-body hover:text-ink"}`;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<OrderSearchParams> }) {
  const session = await auth();
  const filters = parseOrderFilters(await searchParams);
  const [{ orders, total, pageSize }, sites] = session?.user
    ? await Promise.all([listOrdersForOwner(session.user.id, filters), listSitesForOwner(session.user.id)])
    : [{ orders: [], total: 0, pageSize: 50 }, []];
  const page = filters.page ?? 1;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="w-full max-w-5xl p-5 sm:p-10">
      <PageHeader
        title="Commandes"
        subtitle={`${total} commande${total !== 1 ? "s" : ""}${filters.status || filters.siteId ? " pour ces filtres" : ""}.`}
        action={
          total > 0 && (
            <a href={`/commandes/export${filtersQuery({ ...filters, page: undefined })}`} className={BTN_GHOST}>
              <Download size={15} aria-hidden />
              Exporter (CSV)
            </a>
          )
        }
      />

      <nav aria-label="Filtrer par statut" className="mb-3 flex flex-wrap gap-2">
        <Link href={`/commandes${filtersQuery({ ...filters, status: undefined, page: undefined })}`} aria-current={!filters.status ? "page" : undefined} className={chip(!filters.status)}>
          Toutes
        </Link>
        {STATUS_ORDER.map((status) => (
          <Link key={status} href={`/commandes${filtersQuery({ ...filters, status, page: undefined })}`} aria-current={filters.status === status ? "page" : undefined} className={chip(filters.status === status)}>
            {ORDER_STATUS_LABELS[status]}
          </Link>
        ))}
      </nav>

      {sites.length > 1 && (
        <nav aria-label="Filtrer par site" className="mb-6 flex flex-wrap gap-2">
          <Link href={`/commandes${filtersQuery({ ...filters, siteId: undefined, page: undefined })}`} aria-current={!filters.siteId ? "page" : undefined} className={chip(!filters.siteId)}>
            Tous les sites
          </Link>
          {sites.map((site) => (
            <Link key={site.id} href={`/commandes${filtersQuery({ ...filters, siteId: site.id, page: undefined })}`} aria-current={filters.siteId === site.id ? "page" : undefined} className={chip(filters.siteId === site.id)}>
              {site.name}
            </Link>
          ))}
        </nav>
      )}

      {orders.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={ShoppingBag}
            title={filters.status || filters.siteId ? "Aucune commande pour ces filtres." : "Aucune commande pour l'instant."}
            hint="Les commandes passées avec le formulaire de vos landing pages arrivent ici."
          />
        </Card>
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-line list-none m-0 p-0">
            {orders.map((order) => (
              <li key={order.id}>
                <Link href={`/commandes/${order.id}`} className={`grid gap-1 p-5 hover:bg-page sm:grid-cols-[7rem_1fr_auto_auto] sm:items-center sm:gap-4 ${FOCUS}`}>
                  <span className="text-[12px] tabular-nums text-body">{DATE.format(order.createdAt)}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-bold text-ink">{order.customerName}</span>
                    <span className="mt-0.5 block truncate text-[12px] text-body">
                      {formatAlgerianPhone(order.phone)} · {order.wilaya} · <span className="font-mono">{order.reference}</span>
                      {sites.length > 1 && ` · ${order.siteName}`}
                    </span>
                  </span>
                  <span className="text-[14px] font-semibold tabular-nums text-ink">{formatDA(order.total)}</span>
                  <OrderStatusBadge status={order.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between">
          {page > 1 ? (
            <Link href={`/commandes${filtersQuery(filters, { page: page - 1 })}`} className={BTN_GHOST}>
              <ChevronLeft size={15} aria-hidden />
              Précédent
            </Link>
          ) : (
            <span />
          )}
          <span className="text-[12px] text-body">Page {page} sur {pages}</span>
          {page < pages ? (
            <Link href={`/commandes${filtersQuery(filters, { page: page + 1 })}`} className={BTN_GHOST}>
              Suivant
              <ChevronRight size={15} aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
