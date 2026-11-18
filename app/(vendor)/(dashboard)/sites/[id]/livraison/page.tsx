import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/dashboard/ui";
import { auth } from "@/lib/auth";
import { findOwnedSite, getShippingTable } from "@/lib/shipping";
import { ShippingForm } from "./ShippingForm";

export default async function ShippingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user) notFound();
  const [site, table] = await Promise.all([findOwnedSite(session.user.id, id), getShippingTable(session.user.id, id)]);
  if (!site || !table) notFound();

  return (
    <div className="w-full max-w-3xl p-5 sm:p-10">
      <PageHeader title="Livraison" subtitle={`Frais de livraison de « ${site.name} », proposés dans le formulaire de commande.`} />
      <Card>
        <ShippingForm siteId={site.id} initial={table} />
      </Card>
    </div>
  );
}
