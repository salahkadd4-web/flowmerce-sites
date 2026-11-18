import { z } from "zod";
import { optionalHrefSchema, phoneSchema, text } from "@/blocks/shared";

export const footerSchema = z.object({
  id: z.string(),
  shopName: text(80),
  phone: phoneSchema,
  email: z.union([z.literal(""), z.string().trim().email().max(120)]),
  facebook: optionalHrefSchema,
  instagram: optionalHrefSchema,
  tiktok: optionalHrefSchema,
  returnPolicy: text(1000),
});

export type FooterProps = z.infer<typeof footerSchema>;

export const FOOTER_FIELD_LABELS: Record<keyof FooterProps, string> = {
  id: "Identifiant",
  shopName: "Nom de la boutique",
  phone: "Téléphone",
  email: "Email",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  returnPolicy: "Politique de retour",
};
