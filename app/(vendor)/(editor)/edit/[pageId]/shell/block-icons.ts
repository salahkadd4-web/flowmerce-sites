import { ClipboardList, Image as ImageIcon, PanelBottom, PanelTop, ShoppingBag, Square, Type, type LucideIcon } from "lucide-react";
import { isBlockType, type BlockType } from "@/blocks/schemas";

export const BLOCK_ICONS: Record<BlockType, LucideIcon> = {
  Hero: PanelTop,
  Product: ShoppingBag,
  Text: Type,
  OrderForm: ClipboardList,
  Image: ImageIcon,
  Footer: PanelBottom,
};

export function blockIcon(type: string): LucideIcon {
  return isBlockType(type) ? BLOCK_ICONS[type] : Square;
}
