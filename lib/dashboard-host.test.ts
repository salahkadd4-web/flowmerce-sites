import { isDashboardHost } from "@/lib/dashboard-host";

const DASHBOARD = "localhost:3100";

it("reconnaît l'hôte vendeur, sans tenir compte de la casse", () => {
  expect(isDashboardHost("localhost:3100", DASHBOARD)).toBe(true);
  expect(isDashboardHost("LOCALHOST:3100", DASHBOARD)).toBe(true);
});

it("refuse un hôte de site", () => {
  expect(isDashboardHost("test.localhost:3100", DASHBOARD)).toBe(false);
});

it("refuse un hôte absent ou vide", () => {
  expect(isDashboardHost(null, DASHBOARD)).toBe(false);
  expect(isDashboardHost("  ", DASHBOARD)).toBe(false);
});
