import { Card, PageHeader } from "@/components/dashboard/ui";
import { ProductForm } from "../ProductForm";

export default function NewProductPage() {
  return (
    <div className="w-full max-w-3xl p-5 sm:p-10">
      <PageHeader title="Nouveau produit" subtitle="Le produit que vous vendez sur vos landing pages." />
      <Card>
        <ProductForm
          productId={null}
          initial={{ name: "", description: "", price: null, comparePrice: null, images: [], optionAxes: [], stocks: { "": 0 }, active: true }}
        />
      </Card>
    </div>
  );
}
