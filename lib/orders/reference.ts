// Référence de commande donnée à l'acheteur : courte, lisible, dictée au téléphone.
// Alphabet sans 0/O ni 1/I pour éviter les confusions.

import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const FORMAT = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

export function newOrderReference(): string {
  const chars = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

export function isOrderReference(value: string): boolean {
  return FORMAT.test(value);
}
