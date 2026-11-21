import { prisma } from "@/lib/prisma";
import { createSiteForUser } from "@/lib/site-create";
import { resetDb } from "@/lib/test/db";
import { aiTrainingConsentOf, setAiTrainingConsent } from "./ai-consent";

const AMINA = { id: "user-amina", name: "Amina", email: "amina@test.local" };
const KARIM = { id: "user-karim", name: "Karim", email: "karim@test.local" };

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const consentRow = (userId: string) => prisma.tenant.findUnique({ where: { ownerUserId: userId }, select: { aiTrainingConsent: true, aiTrainingConsentAt: true } });

it("pas d'accord par défaut", async () => {
  await createSiteForUser(AMINA, { name: "A", subdomain: "amina" });
  expect(await aiTrainingConsentOf(AMINA.id)).toEqual({ consent: false, at: null });
});

it("accord donné à la création d'un site : enregistré et daté", async () => {
  await createSiteForUser(AMINA, { name: "A", subdomain: "amina", aiTrainingConsent: true });
  const row = await consentRow(AMINA.id);
  expect(row?.aiTrainingConsent).toBe(true);
  expect(row?.aiTrainingConsentAt).toBeInstanceOf(Date);
});

it("une création sans la case cochée ne retire pas un accord déjà donné", async () => {
  await createSiteForUser(AMINA, { name: "A", subdomain: "amina", aiTrainingConsent: true });
  await createSiteForUser(AMINA, { name: "B", subdomain: "amina-b" });
  expect((await aiTrainingConsentOf(AMINA.id)).consent).toBe(true);
});

it("retrait de l'accord : effacé avec sa date ; l'autre vendeur n'est pas touché", async () => {
  await createSiteForUser(AMINA, { name: "A", subdomain: "amina", aiTrainingConsent: true });
  await createSiteForUser(KARIM, { name: "K", subdomain: "karim", aiTrainingConsent: true });
  await setAiTrainingConsent(AMINA.id, false);
  expect(await aiTrainingConsentOf(AMINA.id)).toEqual({ consent: false, at: null });
  expect((await aiTrainingConsentOf(KARIM.id)).consent).toBe(true);
});

it("redonner l'accord le date de nouveau", async () => {
  await createSiteForUser(AMINA, { name: "A", subdomain: "amina" });
  await setAiTrainingConsent(AMINA.id, true);
  expect((await aiTrainingConsentOf(AMINA.id)).at).toBeInstanceOf(Date);
});
