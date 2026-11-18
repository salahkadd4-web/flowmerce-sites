import { routeRequest } from "@/lib/routing";

const cfg = { dashboardHost: "localhost:3000" };
const req = (host: string | null, pathname: string, search = "", method = "GET", isServerAction = false) => ({
  host,
  pathname,
  search,
  method,
  isServerAction,
});

describe("routeRequest — écritures sur un hôte de site", () => {
  it("refuse un server action, quelle que soit la page visée", () => {
    expect(routeRequest(req("test.localhost:3000", "/", "", "POST", true), cfg)).toEqual({ kind: "not-found" });
    expect(routeRequest(req("test.localhost:3000", "/promo", "", "POST", true), cfg)).toEqual({ kind: "not-found" });
  });
  it("refuse l'en-tête de server action même sur une API", () => {
    expect(routeRequest(req("test.localhost:3000", "/api/orders", "", "POST", true), cfg)).toEqual({ kind: "not-found" });
  });
  it("refuse un POST vers une page", () => {
    expect(routeRequest(req("test.localhost:3000", "/", "", "POST"), cfg)).toEqual({ kind: "not-found" });
  });
  it("accepte un POST vers une API autorisée", () => {
    expect(routeRequest(req("test.localhost:3000", "/api/orders", "", "POST"), cfg)).toEqual({ kind: "pass" });
  });
  it("sert une requête HEAD comme un GET", () => {
    expect(routeRequest(req("test.localhost:3000", "/", "", "HEAD"), cfg)).toEqual({ kind: "site", rewritePath: "/s/test.localhost" });
  });
  it("laisse les server actions de l'espace vendeur", () => {
    expect(routeRequest(req("localhost:3000", "/login", "", "POST", true), cfg)).toEqual({ kind: "pass" });
  });
});

describe("routeRequest — hôte vendeur", () => {
  it("laisse passer l'espace vendeur", () => {
    expect(routeRequest(req("localhost:3000", "/"), cfg)).toEqual({ kind: "pass" });
    expect(routeRequest(req("localhost:3000", "/login"), cfg)).toEqual({ kind: "pass" });
  });
  it("ne compare pas la casse de l'hôte vendeur", () => {
    expect(routeRequest(req("LOCALHOST:3000", "/"), cfg)).toEqual({ kind: "pass" });
  });
  it("refuse d'afficher un site par son chemin interne", () => {
    expect(routeRequest(req("localhost:3000", "/s/test.localhost"), cfg)).toEqual({ kind: "not-found" });
    expect(routeRequest(req("localhost:3000", "/s"), cfg)).toEqual({ kind: "not-found" });
  });
  it("ne confond pas /s avec un chemin qui commence par s", () => {
    expect(routeRequest(req("localhost:3000", "/sites"), cfg)).toEqual({ kind: "pass" });
  });
});

describe("routeRequest — sites", () => {
  it("réécrit l'accueil sans / final", () => {
    expect(routeRequest(req("test.localhost:3000", "/"), cfg)).toEqual({ kind: "site", rewritePath: "/s/test.localhost" });
  });
  it("normalise l'hôte et garde le chemin et la query", () => {
    expect(routeRequest(req("TEST.localhost:3000", "/produit/a", "?utm_source=fb"), cfg)).toEqual({
      kind: "site",
      rewritePath: "/s/test.localhost/produit/a?utm_source=fb",
    });
  });
  it("réécrit /login vers le site, jamais vers l'espace vendeur", () => {
    expect(routeRequest(req("test.localhost:3000", "/login"), cfg)).toEqual({ kind: "site", rewritePath: "/s/test.localhost/login" });
  });
  it("bloque l'authentification sur un hôte de site", () => {
    expect(routeRequest(req("test.localhost:3000", "/api/auth/session"), cfg)).toEqual({ kind: "not-found" });
    expect(routeRequest(req("test.localhost:3000", "/api/auth"), cfg)).toEqual({ kind: "not-found" });
  });
  it("laisse passer les autres API", () => {
    expect(routeRequest(req("test.localhost:3000", "/api/orders"), cfg)).toEqual({ kind: "pass" });
  });
  it("réécrit l'accueil avec une query", () => {
    expect(routeRequest(req("test.localhost:3000", "/", "?a=1"), cfg)).toEqual({ kind: "site", rewritePath: "/s/test.localhost?a=1" });
  });
});

describe("routeRequest — hôte absent", () => {
  it("renvoie not-found", () => {
    expect(routeRequest(req(null, "/"), cfg)).toEqual({ kind: "not-found" });
    expect(routeRequest(req("  ", "/"), cfg)).toEqual({ kind: "not-found" });
  });
});
