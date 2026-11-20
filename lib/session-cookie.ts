// lib/session-cookie.ts — cookies d'Auth.js de l'espace vendeur.
//
// Noms propres à Flowmerce Sites : sur localhost, flowmerce-web-app pose aussi
// les cookies « authjs.* » avec un autre secret, et les navigateurs ne séparent
// pas les cookies par port. Avec les mêmes noms, chaque application lit le
// cookie de l'autre (« no matching decryption secret ») et chaque connexion
// déconnecte de l'autre.
//
// Mêmes options que les cookies par défaut d'Auth.js, et aucun attribut Domain :
// ils restent limités à l'hôte vendeur et ne sont jamais envoyés aux sites des
// vendeurs (§7).

function cookie(name: string, secure: boolean) {
  return { name, options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure } };
}

export function authCookies(protocol: "http" | "https") {
  const secure = protocol === "https";
  // Les préfixes __Secure- et __Host- exigent l'attribut Secure : ils vont ensemble.
  const prefix = secure ? "__Secure-" : "";
  return {
    sessionToken: cookie(`${prefix}fm-sites.session-token`, secure),
    callbackUrl: cookie(`${prefix}fm-sites.callback-url`, secure),
    csrfToken: cookie(`${secure ? "__Host-" : ""}fm-sites.csrf-token`, secure),
  };
}
