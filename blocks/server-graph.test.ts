// La configuration Puck partagée est importée par les pages publiques (composants
// serveur). Next ajoute au bundle du navigateur tout module "use client" qu'elle
// importe, même jamais rendu : un seul import client y ferait télécharger tout
// l'éditeur Puck aux acheteurs (anti-objectif n° 1 de la conception 1A).

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function resolveLocal(spec: string, from: string): string | null {
  const base = spec.startsWith("@/") ? path.join(ROOT, spec.slice(2)) : path.resolve(path.dirname(from), spec);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
    if (existsSync(candidate) && candidate.match(/\.tsx?$/)) return candidate;
  }
  return null;
}

/** Fichiers du projet atteints par des imports non typés, et imports de paquets. */
function walk(entry: string) {
  const seen = new Set<string>();
  const packages: { file: string; spec: string }[] = [];
  const stack = [entry];
  while (stack.length) {
    const file = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/^import\s+(?!type\b)[^;]*?from\s+["']([^"']+)["']/gm)) {
      const spec = match[1];
      if (spec.startsWith(".") || spec.startsWith("@/")) {
        const target = resolveLocal(spec, file);
        if (target) stack.push(target);
      } else {
        packages.push({ file: path.relative(ROOT, file), spec });
      }
    }
  }
  return { files: [...seen], packages };
}

const { files, packages } = walk(path.join(ROOT, "blocks", "puck.config.ts"));

// Seuls composants client permis dans les pages publiques : ceux faits pour l'acheteur.
const BUYER_CLIENT_MODULES = [path.join("blocks", "order-form", "OrderForm.tsx")];

it("la configuration Puck partagée n'importe que les composants client destinés à l'acheteur", () => {
  const clientModules = files
    .filter((file) => /^\s*["']use client["']/.test(readFileSync(file, "utf8")))
    .map((file) => path.relative(ROOT, file));
  expect(clientModules.filter((file) => !BUYER_CLIENT_MODULES.includes(file))).toEqual([]);
});

it("le formulaire de commande fait bien partie des pages publiques", () => {
  expect(files.map((file) => path.relative(ROOT, file))).toContain(BUYER_CLIENT_MODULES[0]);
});

it("la configuration Puck partagée n'importe pas l'éditeur (@puckeditor/core hors types)", () => {
  expect(packages.filter(({ spec }) => spec === "@puckeditor/core")).toEqual([]);
});
