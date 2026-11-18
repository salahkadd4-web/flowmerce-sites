// Détail d'une commande : client, adresse, lignes, totaux, provenance, statut et historique.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone } from "lucide-react";
import { BTN_PRIMARY, Card, CardTitle, FOCUS, OrderStatusBadge, PageHeader } from "@/components/dashboard/ui";
import { wilayaName } from "@/lib/algeria/wilayas";
import { auth } from "@/lib/auth";
import { formatDA } from "@/lib/money";
import { findOwnedOrder, itemLabel } from "@/lib/orders/manage";
import { DELIVERY_LABELS, ORDER_STATUS_LABELS, ORDER_TRANSITIONS } from "@/lib/orders/status";
import { formatAlgerianPhone } from "@/lib/phone";
import { StatusActions } from "./StatusActions";

const DATE = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Algiers" });

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const order = session?.user ? await findOwnedOrder(session.user.id, id) : null;
  if (!order) notFound();

  const source = (order.source as Record<string, string> | null) ?? {};
  const row = (label: React.ReactNode, value: React.ReactNode, key?: string) => (
    <div key={key} className="flex justify-between gap-4 py-1.5">
      <dt className="text-body">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );

  return (
    <div className="w-full max-w-3xl p-5 sm:p-10">
      <Link href="/commandes" className={`mb-4 inline-flex items-center gap-1.5 rounded-control text-[13px] font-semibold text-body hover:text-ink ${FOCUS}`}>
        <ArrowLeft size={15} aria-hidden />
        Commandes
      </Link>
      <PageHeader
        title={`Commande ${order.reference}`}
        subtitle={`${DATE.format(order.createdAt)} · ${order.site.name}`}
        action={<OrderStatusBadge status={order.status} />}
      />

      <div className="flex flex-col gap-4">
        <Card>
          <CardTitle
            aside={
              <a href={`tel:${order.phone}`} className={BTN_PRIMARY}>
                <Phone size={15} aria-hidden />
                Appeler
              </a>
            }
          >
            Client
          </CardTitle>
          <dl className="text-[14px]">
            {row("Nom", order.customerName)}
            {row("Téléphone", formatAlgerianPhone(order.phone))}
            {row("Wilaya", wilayaName(order.wilayaCode) ?? order.wilayaCode)}
            {row("Commune", order.commune)}
            {row("Adresse", order.address)}
            {row("Livraison", DELIVERY_LABELS[order.deliveryType])}
          </dl>
        </Card>

        <Card>
          <CardTitle>Produits</CardTitle>
          <ul className="m-0 list-none divide-y divide-line p-0 text-[14px]">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-2">
                <span className="text-ink">{itemLabel(item)}</span>
                <span className="tabular-nums text-ink">{formatDA(item.unitPrice * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 border-t border-line pt-2 text-[14px]">
            {row("Sous-total", formatDA(order.subtotal))}
            {row("Livraison", formatDA(order.shippingFee))}
            {row(<span className="font-bold text-ink">Total à encaisser</span>, <span className="text-[16px] font-extrabold">{formatDA(order.total)}</span>)}
          </dl>
        </Card>

        <Card>
          <CardTitle>Statut</CardTitle>
          <StatusActions orderId={order.id} next={ORDER_TRANSITIONS[order.status]} />
        </Card>

        <Card>
          <CardTitle>Historique</CardTitle>
          <ol className="m-0 flex list-none flex-col gap-3 p-0 text-[13px]">
            {order.events.map((event) => (
              <li key={event.id} className="border-l-2 border-line pl-3">
                <p className="font-semibold text-ink">
                  {event.from ? `${ORDER_STATUS_LABELS[event.from]} → ` : ""}
                  {ORDER_STATUS_LABELS[event.to]}
                </p>
                <p className="text-body">
                  {DATE.format(event.createdAt)} · {event.actor === "client" ? "Commande passée par le client" : event.actor}
                </p>
                {event.note && <p className="mt-1 text-ink">{event.note}</p>}
              </li>
            ))}
          </ol>
        </Card>

        {Object.keys(source).length > 0 && (
          <Card>
            <CardTitle>Provenance</CardTitle>
            <dl className="text-[14px]">{Object.entries(source).map(([key, value]) => row(key, value, key))}</dl>
          </Card>
        )}
      </div>
    </div>
  );
}
