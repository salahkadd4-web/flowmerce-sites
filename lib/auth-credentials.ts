// lib/auth-credentials.ts — vérification email / mot de passe du compte provisoire.
// Séparé de lib/auth.ts pour être testé sans NextAuth.

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function authorizeCredentials(
  email: string,
  password: string,
): Promise<{ id: string; email: string; name: string | null } | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) return null;

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, email: user.email, name: user.name };
}
