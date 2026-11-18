import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/dashboard/ui";
import { auth } from "@/lib/auth";
import { toPublicProduct, variantKey } from "@/lib/product-input";
import { findOwnedProduct } from "@/lib/products";
import { ProductForm } from "../ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const product = session?.user ? await findOwnedProduct(session.user.id, id) : null;
  if (!product) notFound();

  // toPublicProduct valide images et options ; le stock exact vient des variantes.
  const { images, optionAxes } = toPublicProduct(product);
  const stocks = Object.fromEntries(product.variants.map((v) => [variantKey(v.options as Record<string, string>), v.stock]));

  return (
    <div className="w-full max-w-3xl p-5 sm:p-10">
      <PageHeader title={product.name} subtitle="Modifier le produit." />
      <Card>
        <ProductForm
          productId={product.id}
          initial={{
            name: product.name,
            description: product.description,
            price: product.price,
            comparePrice: product.comparePrice,
            images,
            optionAxes,
            stocks,
            active: product.active,
          }}
        />
      </Card>
    </div>
  );
}
