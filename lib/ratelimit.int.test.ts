import { prisma } from "@/lib/prisma";
import { hitRateLimit } from "@/lib/ratelimit";
import { resetDb } from "@/lib/test/db";

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

it("autorise jusqu'à la limite puis refuse", async () => {
  const results = [];
  for (let i = 0; i < 4; i++) results.push(await hitRateLimit("ip:1.2.3.4", 3, 60));
  expect(results).toEqual([true, true, true, false]);
});

it("compte chaque clé séparément", async () => {
  await hitRateLimit("ip:a", 1, 60);
  expect(await hitRateLimit("ip:a", 1, 60)).toBe(false);
  expect(await hitRateLimit("ip:b", 1, 60)).toBe(true);
});

it("ouvre une nouvelle fenêtre après l'expiration", async () => {
  await hitRateLimit("ip:c", 1, 60);
  await prisma.rateLimit.update({ where: { key: "ip:c" }, data: { resetAt: new Date(Date.now() - 1000) } });
  expect(await hitRateLimit("ip:c", 1, 60)).toBe(true);
});

it("reste exact sous des appels simultanés", async () => {
  const results = await Promise.all(Array.from({ length: 10 }, () => hitRateLimit("ip:d", 5, 60)));
  expect(results.filter(Boolean)).toHaveLength(5);
});
