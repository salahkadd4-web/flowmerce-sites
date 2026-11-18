// lib/phone.ts — numéros algériens, normalisés en +213… (§2.4, §7).
//
//   mobile  0[5-7] + 8 chiffres   ex. 0555 12 34 56 → +213555123456
//   fixe    0[2-4] + 7 chiffres   ex. 021 23 45 67  → +21321234567
//
// Préfixes +213, 00213 et 213 acceptés ; espaces, points, tirets et parenthèses ignorés.

const MOBILE = /^0[5-7]\d{8}$/;
const LANDLINE = /^0[2-4]\d{7}$/;

export function normalizeAlgerianPhone(input: string): string | null {
  if (!/^[+0-9 .()-]+$/.test(input.trim())) return null;
  let digits = input.replace(/[^0-9+]/g, "");
  if (digits.startsWith("+213")) digits = "0" + digits.slice(4);
  else if (digits.startsWith("00213")) digits = "0" + digits.slice(5);
  else if (digits.startsWith("213")) digits = "0" + digits.slice(3);
  if (digits.includes("+")) return null;
  if (!MOBILE.test(digits) && !LANDLINE.test(digits)) return null;
  return "+213" + digits.slice(1);
}

/** +213555123456 → « 0555 12 34 56 » ; +21321234567 → « 021 23 45 67 ». */
export function formatAlgerianPhone(normalized: string): string {
  const match = /^\+213(\d{8,9})$/.exec(normalized);
  if (!match) return normalized;
  const local = "0" + match[1];
  return local.length === 10
    ? `${local.slice(0, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)} ${local.slice(8)}`
    : `${local.slice(0, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
}
