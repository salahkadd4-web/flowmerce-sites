// lib/storage.ts — stockage des fichiers envoyés (§4.2).
//
// Pilote local : dossier storage/uploads/ (ignoré par git). Au déploiement, un
// pilote S3 / Vercel Blob implémentera la même interface, sans toucher au reste.
// Seules les clés au format de isMediaKey sont acceptées : aucune traversée de dossier.

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { isMediaKey } from "@/lib/media";

export interface Storage {
  put(key: string, bytes: Uint8Array): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  remove(key: string): Promise<void>;
}

const ROOT = path.join(process.cwd(), "storage", "uploads");

function fileFor(key: string): string {
  if (!isMediaKey(key)) throw new Error("Clé de média invalide");
  return path.join(ROOT, key);
}

export const storage: Storage = {
  async put(key, bytes) {
    const file = fileFor(key);
    await mkdir(ROOT, { recursive: true });
    await writeFile(file, bytes, { flag: "wx" });
  },
  async get(key) {
    if (!isMediaKey(key)) return null;
    try {
      return new Uint8Array(await readFile(fileFor(key)));
    } catch {
      return null;
    }
  },
  async remove(key) {
    if (!isMediaKey(key)) return;
    await rm(fileFor(key), { force: true });
  },
};
