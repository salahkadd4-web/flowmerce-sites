import bcrypt from "bcryptjs";
import { authorizeCredentials } from "@/lib/auth-credentials";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/db";

beforeEach(async () => {
  await resetDb();
  await prisma.user.create({
    data: { email: "vendeur@test.local", name: "Vendeur", passwordHash: await bcrypt.hash("bon-mot-de-passe", 10) },
  });
});
afterAll(() => prisma.$disconnect());

it("accepte les bons identifiants", async () => {
  const user = await authorizeCredentials("vendeur@test.local", "bon-mot-de-passe");
  expect(user).toMatchObject({ email: "vendeur@test.local", name: "Vendeur" });
  expect(typeof user?.id).toBe("string");
});

it("ignore la casse et les espaces de l'email", async () => {
  expect(await authorizeCredentials("  Vendeur@Test.local ", "bon-mot-de-passe")).not.toBeNull();
});

it("refuse un mauvais mot de passe", async () => {
  expect(await authorizeCredentials("vendeur@test.local", "mauvais")).toBeNull();
});

it("refuse un email inconnu", async () => {
  expect(await authorizeCredentials("inconnu@test.local", "bon-mot-de-passe")).toBeNull();
});

it("refuse un mot de passe vide", async () => {
  expect(await authorizeCredentials("vendeur@test.local", "")).toBeNull();
});

it("ne renvoie pas le hash du mot de passe", async () => {
  const user = await authorizeCredentials("vendeur@test.local", "bon-mot-de-passe");
  expect(user).not.toHaveProperty("passwordHash");
});

it("calcule un bcrypt même pour un email inconnu (pas d'écart de temps révélant les comptes)", async () => {
  const spy = vi.spyOn(bcrypt, "compare");
  try {
    expect(await authorizeCredentials("inconnu@test.local", "bon-mot-de-passe")).toBeNull();
    expect(spy).toHaveBeenCalledTimes(1);
  } finally {
    spy.mockRestore();
  }
});
