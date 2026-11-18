import { GET } from "@/app/media/[key]/route";
import { storeMedia } from "@/lib/media-store";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { resetDb } from "@/lib/test/db";
import { PNG_1X1 } from "@/test/image-fixtures";

const call = (key: string) => GET(new Request(`http://localhost/media/${key}`), { params: Promise.resolve({ key }) });
const created: string[] = [];

beforeEach(resetDb);
afterAll(async () => {
  await Promise.all(created.map((key) => storage.remove(key)));
  await prisma.$disconnect();
});

it("répond 404 à une clé invalide ou inconnue", async () => {
  expect((await call("../../package.json")).status).toBe(404);
  expect((await call("a".repeat(32) + ".svg")).status).toBe(404);
  expect((await call("b".repeat(32) + ".png")).status).toBe(404);
});

it("sert une image enregistrée avec son type, nosniff et un cache immuable", async () => {
  const tenant = await prisma.tenant.create({ data: { name: "T", ownerUserId: "media-route" } });
  const stored = await storeMedia(tenant.id, PNG_1X1);
  if (!stored.ok) throw new Error(stored.error);
  const key = stored.media.url.replace("/media/", "");
  created.push(key);

  const response = await call(key);
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("image/png");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(response.headers.get("cache-control")).toContain("immutable");
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(PNG_1X1);
});
