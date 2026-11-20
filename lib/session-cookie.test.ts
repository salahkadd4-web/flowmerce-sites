import { authCookies } from "./session-cookie";

describe("authCookies", () => {
  it("porte des noms propres à Flowmerce Sites, distincts des noms par défaut d'Auth.js", () => {
    // flowmerce-web-app, sur le même localhost, garde les noms « authjs.* » :
    // les navigateurs ne séparent pas les cookies par port.
    const cookies = authCookies("http");
    expect(cookies.sessionToken.name).toBe("fm-sites.session-token");
    expect(cookies.csrfToken.name).toBe("fm-sites.csrf-token");
    expect(cookies.callbackUrl.name).toBe("fm-sites.callback-url");
    for (const cookie of Object.values(cookies)) expect(cookie.name).not.toContain("authjs");
  });

  it("garde les préfixes d'Auth.js et l'attribut Secure en https", () => {
    const cookies = authCookies("https");
    expect(cookies.sessionToken.name).toBe("__Secure-fm-sites.session-token");
    expect(cookies.callbackUrl.name).toBe("__Secure-fm-sites.callback-url");
    expect(cookies.csrfToken.name).toBe("__Host-fm-sites.csrf-token");
    for (const cookie of Object.values(cookies)) expect(cookie.options.secure).toBe(true);
  });

  it("reste limité à l'hôte vendeur : aucun attribut Domain, SameSite lax, chemin /", () => {
    for (const protocol of ["http", "https"] as const) {
      for (const { options } of Object.values(authCookies(protocol))) {
        expect(options).not.toHaveProperty("domain");
        expect(options.sameSite).toBe("lax");
        expect(options.path).toBe("/");
      }
    }
    const { sessionToken, csrfToken } = authCookies("http");
    expect(sessionToken.options.httpOnly).toBe(true);
    expect(csrfToken.options.httpOnly).toBe(true);
    expect(sessionToken.options.secure).toBe(false);
  });
});
