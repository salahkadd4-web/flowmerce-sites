import { storeMedia } from "@/lib/media-store";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { resetDb } from "@/lib/test/db";
import { PNG_1X1, SVG } from "@/test/image-fixtures";

const created: string[] = [];

beforeEach(resetDb);
afterAll(async () => {
  await Promise.all(created.map((key) => storage.remove(key)));
  await prisma.$disconnect();
});

async function tenant() {
  return prisma.tenant.create({ data: { name: "Boutique", ownerUserId: "media-owner" } });
}

it("enregistre l'image et sa ligne Media", async () => {
  const { id } = await tenant();
  const result = await storeMedia(id, PNG_1X1);

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const key = result.media.url.replace("/media/", "");
  created.push(key);

  expect(result.media).toMatchObject({ width: 1, height: 1 });
  expect(result.media.url).toMatch(/^\/media\/[a-f0-9]{32}\.png$/);
  expect(await storage.get(key)).toEqual(PNG_1X1);

  const row = await prisma.media.findUnique({ where: { key } });
  expect(row).toMatchObject({ tenantId: id, mimeType: "image/png", sizeBytes: PNG_1X1.byteLength });
});

it("n'enregistre ni fichier ni ligne pour un SVG", async () => {
  const { id } = await tenant();
  const result = await storeMedia(id, SVG);

  expect(result).toEqual({ ok: false, error: "Format non pris en charge : JPEG, PNG, WebP ou AVIF" });
  expect(await prisma.media.count()).toBe(0);
});

it("refuse de lire une clé qui sort du dossier de stockage", async () => {
  expect(await storage.get("../../package.json")).toBeNull();
  await expect(storage.put("../evil.png", PNG_1X1)).rejects.toThrow();
});
