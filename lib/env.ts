// lib/env.ts — Flowmerce Sites
//
// Variables d'environnement validées au démarrage. Aucun domaine n'est écrit
// en dur dans le code : tout passe par ici.

import { z } from "zod";

// Une valeur vide vaut absence (une ligne `SITES_PORT=` ne doit rien casser).
const optionalNonEmpty = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().min(1).optional(),
);

const ServerSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),

  // Domaine racine des sous-domaines vendeurs (local : localhost).
  SITES_ROOT_DOMAIN: z.string().min(1),
  // Hôte de l'espace vendeur, port compris (local : localhost:3100).
  DASHBOARD_HOST: z.string().min(1),
  // Protocole et port des adresses de sites affichées au vendeur.
  SITES_PROTOCOL: z.enum(["http", "https"]).default("https"),
  SITES_PORT: optionalNonEmpty,
});

export type ServerEnv = z.infer<typeof ServerSchema>;

export const env: ServerEnv = ServerSchema.parse(process.env);
