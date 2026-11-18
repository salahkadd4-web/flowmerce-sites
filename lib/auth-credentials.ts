// lib/auth-credentials.ts — vérification email / mot de passe du compte provisoire.
// Séparé de lib/auth.ts pour être testé sans NextAuth.

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Hash factice de même coût (10) que les vrais : comparé quand l'email est
// inconnu, pour que la réponse prenne le même temps qu'un mauvais mot de passe
// et ne révèle pas quels emails ont un compte.
const DUMMY_HASH = "$2b$10$.cYxFBRU2ZAwCx.k7CoxIe0IgQQBJIoL.i0Kc5T5TqfviOHDJpuGq";

export async function authorizeCredentials(
  email: string,
  password: string,
): Promise<{ id: string; email: string; name: string | null } | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) return null;

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return null;

  return { id: user.id, email: user.email, name: user.name };
}
