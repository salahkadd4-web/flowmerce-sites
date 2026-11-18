import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { assertDashboardHost, isDashboardHost } from "@/lib/dashboard-host";

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

describe("assertDashboardHost", () => {
  it("lève pour un hôte de site ou absent", () => {
    expect(() => assertDashboardHost("test.localhost:3100", DASHBOARD)).toThrow("Action appelée hors de l'hôte vendeur");
    expect(() => assertDashboardHost(null, DASHBOARD)).toThrow();
  });

  it("laisse passer l'hôte vendeur", () => {
    expect(() => assertDashboardHost("localhost:3100", DASHBOARD)).not.toThrow();
  });

  it("est appelée par chaque fichier d'actions de l'espace vendeur", () => {
    const root = path.resolve(__dirname, "..", "app", "(vendor)");
    const actions: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (entry === "actions.ts") actions.push(full);
      }
    };
    walk(root);
    expect(actions.length).toBeGreaterThanOrEqual(6);
    const missing = actions.filter((file) => !readFileSync(file, "utf8").includes("assertDashboardHost("));
    expect(missing.map((file) => path.relative(root, file))).toEqual([]);
  });
});
