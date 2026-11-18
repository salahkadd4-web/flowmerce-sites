import {
  getSubdomain,
  isReservedSubdomain,
  normalizeHost,
  RESERVED_SUBDOMAINS,
  siteUrl,
} from "@/lib/host";

describe("normalizeHost", () => {
  it("met en minuscules et retire le port", () => {
    expect(normalizeHost("TEST.Localhost:3000")).toBe("test.localhost");
  });
  it("retire le point final", () => {
    expect(normalizeHost("test.localhost.")).toBe("test.localhost");
  });
  it("retire le point final placé avant le port", () => {
    expect(normalizeHost("TEST.Localhost.:3000")).toBe("test.localhost");
  });
  it("retire les espaces", () => {
    expect(normalizeHost("  test.localhost:3100 ")).toBe("test.localhost");
  });
});

describe("getSubdomain", () => {
  it("renvoie l'étiquette devant le domaine racine", () => {
    expect(getSubdomain("test.localhost", "localhost")).toBe("test");
    expect(getSubdomain("boutique.flowmerce.dz", "flowmerce.dz")).toBe("boutique");
  });
  it("normalise l'hôte avant de le lire", () => {
    expect(getSubdomain("TEST.localhost:3000", "localhost")).toBe("test");
  });
  it("renvoie null pour le domaine racine lui-même", () => {
    expect(getSubdomain("localhost", "localhost")).toBeNull();
  });
  it("renvoie null pour un sous-domaine imbriqué", () => {
    expect(getSubdomain("a.b.localhost", "localhost")).toBeNull();
  });
  it("renvoie null pour un autre domaine", () => {
    expect(getSubdomain("test.exemple.com", "localhost")).toBeNull();
    expect(getSubdomain("evillocalhost", "localhost")).toBeNull();
  });
});

describe("isReservedSubdomain", () => {
  it("reconnaît les noms réservés, quelle que soit la casse", () => {
    expect(isReservedSubdomain("app")).toBe(true);
    expect(isReservedSubdomain("APP")).toBe(true);
  });
  it("laisse passer un nom de boutique", () => {
    expect(isReservedSubdomain("test")).toBe(false);
  });
  it("contient la liste du plan", () => {
    for (const name of ["app", "api", "www", "admin", "mail", "sites", "dashboard", "static", "cdn", "assets", "help", "support", "status", "blog", "docs", "s"]) {
      expect(RESERVED_SUBDOMAINS.has(name)).toBe(true);
    }
  });
});

describe("siteUrl", () => {
  it("ajoute le port quand il est fourni", () => {
    expect(siteUrl("test", { rootDomain: "localhost", protocol: "http", port: "3000" })).toBe("http://test.localhost:3000");
  });
  it("n'ajoute pas de port sinon", () => {
    expect(siteUrl("boutique", { rootDomain: "flowmerce.dz", protocol: "https" })).toBe("https://boutique.flowmerce.dz");
  });
});
