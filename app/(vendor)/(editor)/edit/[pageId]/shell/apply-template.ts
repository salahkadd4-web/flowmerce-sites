// Appliquer un modèle à la page en cours d'édition : le modèle apporte ses
// sections, photos, couleurs et polices ; la page garde son produit, sa langue,
// son titre d'onglet et le nom de boutique de son pied de page. Chaque section
// reçoit un nouvel identifiant, et les liens internes (bouton → fiche produit) suivent.

import { productAnchor } from "@/blocks/product/ProductBlock";

type Block = { type: string; props: Record<string, unknown> & { id?: string } };
type PageData = { root?: { props?: Record<string, unknown> }; content?: Block[] };

const KEPT_ROOT_PROPS = ["productId", "lang", "title"] as const;

export function applyTemplate(current: unknown, template: unknown): unknown {
  const page = (current ?? {}) as PageData;
  const model = structuredClone(template) as PageData;
  const currentRoot = page.root?.props ?? {};

  const rootProps: Record<string, unknown> = { ...(model.root?.props ?? {}) };
  for (const key of KEPT_ROOT_PROPS) {
    if (currentRoot[key] !== undefined) rootProps[key] = currentRoot[key];
  }

  const shopName = page.content?.find((block) => block.type === "Footer")?.props.shopName;

  // Nouveaux identifiants, et correspondance des ancres (#produit-<id>) à réécrire.
  const anchors = new Map<string, string>();
  const content = (model.content ?? []).map((block) => {
    const id = `${block.type}-${crypto.randomUUID()}`;
    if (block.props.id) anchors.set(`#${productAnchor(block.props.id)}`, `#${productAnchor(id)}`);
    const props: Block["props"] = { ...block.props, id };
    if (block.type === "Footer" && typeof shopName === "string" && shopName.trim() !== "") props.shopName = shopName;
    return { ...block, props };
  });
  for (const block of content) {
    const href = block.props.buttonHref;
    if (typeof href === "string" && anchors.has(href)) block.props.buttonHref = anchors.get(href);
  }

  return { ...model, root: { ...(model.root ?? {}), props: rootProps }, content };
}
