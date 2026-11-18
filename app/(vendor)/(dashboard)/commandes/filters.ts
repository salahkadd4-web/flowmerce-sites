// Filtres de la liste des commandes, lus dans l'URL (partagés par la page et l'export).

import { OrderStatus } from "@prisma/client";
import type { OrderFilters } from "@/lib/orders/manage";

const STATUSES = new Set<string>(Object.values(OrderStatus));

export type OrderSearchParams = { statut?: string | string[]; site?: string | string[]; page?: string | string[] };

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

export function parseOrderFilters(params: OrderSearchParams): OrderFilters {
  const status = one(params.statut);
  const site = one(params.site);
  const page = Number(one(params.page));
  return {
    ...(status && STATUSES.has(status) ? { status: status as OrderStatus } : {}),
    ...(site && site.length <= 40 ? { siteId: site } : {}),
    ...(Number.isInteger(page) && page > 1 ? { page } : {}),
  };
}

export function filtersQuery(filters: OrderFilters, overrides: Partial<OrderFilters> = {}): string {
  const merged = { ...filters, ...overrides };
  const query = new URLSearchParams();
  if (merged.status) query.set("statut", merged.status);
  if (merged.siteId) query.set("site", merged.siteId);
  if (merged.page && merged.page > 1) query.set("page", String(merged.page));
  const text = query.toString();
  return text ? `?${text}` : "";
}
