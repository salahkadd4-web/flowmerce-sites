// « Produits » — catalogue du vendeur (§2.4), structure de liste de « Mes sites ».

import Image from "next/image";
import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { BTN_PRIMARY, Card, EmptyState, FOCUS, PageHeader } from "@/components/dashboard/ui";
import { auth } from "@/lib/auth";
import { formatDA } from "@/lib/money";
import { listProductsForOwner } from "@/lib/products";

export default async function ProductsPage() {
  const session = await auth();
  const products = session?.user ? await listProductsForOwner(session.user.id) : [];

  const create = (label: string) => (
    <Link href="/produits/new" className={BTN_PRIMARY}>
      <Plus size={15} strokeWidth={2} aria-hidden />
      {label}
    </Link>
  );

  return (
    <div className="w-full max-w-3xl p-5 sm:p-10">
      <PageHeader
        title="Produits"
        subtitle={`${products.length} produit${products.length !== 1 ? "s" : ""}.`}
        action={products.length > 0 && create("Nouveau produit")}
      />

      {products.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={Package}
            title="Aucun produit pour l'instant."
            hint="Ajoutez le produit que vous vendez, puis choisissez-le comme « Produit de la page » dans l'éditeur."
            action={create("Ajouter mon premier produit")}
          />
        </Card>
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-line list-none m-0 p-0">
            {products.map((product) => (
              <li key={product.id}>
                <Link href={`/produits/${product.id}`} className={`flex items-center gap-4 p-5 hover:bg-page ${FOCUS}`}>
                  {product.image ? (
                    <Image src={product.image.url} alt="" width={product.image.width} height={product.image.height} sizes="56px" className="size-14 shrink-0 rounded-control object-cover" />
                  ) : (
                    <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-control bg-page text-faint">
                      <Package size={20} strokeWidth={1.75} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold text-ink">{product.name}</span>
                    <span className="mt-0.5 block text-[12px] text-body">
                      {formatDA(product.price)} · {product.totalStock} en stock
                    </span>
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      product.active ? "bg-green-50 text-green-800" : "bg-page text-body"
                    }`}
                  >
                    {product.active ? "Actif" : "Inactif"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
