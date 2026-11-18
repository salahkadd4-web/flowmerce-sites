"use client";

// Navigation de l'espace vendeur — même lien que flowmerce-web-app
// (components/layout/DashboardNav.tsx, NavLink).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Package, ShoppingBag, type LucideIcon } from "lucide-react";
import { FOCUS } from "@/components/dashboard/ui";

type NavItem = { href: string; label: string; sublabel: string; Icon: LucideIcon; exact: boolean };

const NAV_LINKS: NavItem[] = [
  { href: "/", label: "Mes sites", sublabel: "Landing pages et boutiques", Icon: Globe, exact: true },
  { href: "/produits", label: "Produits", sublabel: "Catalogue et stock", Icon: Package, exact: false },
  { href: "/commandes", label: "Commandes", sublabel: "À confirmer, à expédier", Icon: ShoppingBag, exact: false },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const { href, label, sublabel, Icon } = item;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-2.5 rounded-control px-3 py-2 transition-colors ${FOCUS} ${
        active ? "bg-brand-soft text-brand-ink" : "text-body hover:bg-page hover:text-ink"
      }`}
    >
      <span
        aria-hidden
        className={`flex size-6 shrink-0 items-center justify-center rounded-control transition-colors ${
          active ? "bg-brand text-on-brand" : "bg-page text-body group-hover:bg-line"
        }`}
      >
        <Icon size={13} strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className={`block text-[13px] leading-none ${active ? "font-semibold" : "font-medium"}`}>
          {label}
        </span>
        <span className="mt-1 block text-[10.5px] leading-none text-faint">{sublabel}</span>
      </span>
    </Link>
  );
}

export function DashboardNav() {
  const pathname = usePathname();
  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav aria-label="Navigation principale" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">Menu</p>
      {NAV_LINKS.map((item) => (
        <NavLink key={item.href} item={item} active={isActive(item.href, item.exact)} />
      ))}
    </nav>
  );
}
