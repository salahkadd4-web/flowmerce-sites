import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";
import { validatePageContent } from "@/lib/page-content";
import { pageFromTemplate, templateById, TEMPLATES } from "./index";

describe("registre des modèles", () => {
  it("commence par le modèle simple, connu par son identifiant historique", () => {
    expect(TEMPLATES[0]).toMatchObject({ id: "landing-fr", name: "Modèle simple", preview: null });
    expect(templateById("landing-fr")).toBe(TEMPLATES[0]);
  });

  it("ne connaît pas un modèle inventé", () => {
    expect(templateById("inconnu")).toBeUndefined();
    expect(templateById("__proto__")).toBeUndefined();
  });

  it("chaque modèle a un identifiant unique, un nom et une description", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const template of TEMPLATES) {
      expect(template.name).not.toBe("");
      expect(template.description).not.toBe("");
    }
  });

  it.each(TEMPLATES.map((t) => [t.id, t] as const))("le modèle %s est un contenu de page valide", (_id, template) => {
    const result = validatePageContent(template.data);
    expect(result.ok ? "ok" : result.error).toBe("ok");
  });
});

describe("les cinq modèles pro", () => {
  const PRO = ["mode", "chaussures", "beaute", "montres", "maison"];
  const PUBLIC = path.join(process.cwd(), "public");
  const urls = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.flatMap(urls);
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      const own = typeof record.url === "string" && record.url.startsWith("/templates/") ? [record.url] : [];
      return [...own, ...Object.values(record).flatMap(urls)];
    }
    return [];
  };

  it("une catégorie chacun : vêtements, chaussures, cosmétique, montres, maison", () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual(["landing-fr", ...PRO]);
    expect(new Set(TEMPLATES.map((t) => t.category)).size).toBe(TEMPLATES.length);
  });

  it.each(PRO)("%s : chaque photo existe, aux dimensions annoncées, légère", (id) => {
    const template = templateById(id)!;
    const images = urls(template.data);
    expect(images.length).toBeGreaterThanOrEqual(2);
    const declared = new Map<string, { width: number; height: number }>();
    const walk = (value: unknown): void => {
      if (Array.isArray(value)) return value.forEach(walk);
      if (value && typeof value === "object") {
        const r = value as Record<string, unknown>;
        if (typeof r.url === "string" && typeof r.width === "number") declared.set(r.url, { width: r.width, height: r.height as number });
        Object.values(r).forEach(walk);
      }
    };
    walk(template.data);
    for (const url of images) {
      const file = path.join(PUBLIC, url);
      expect(fs.existsSync(file), url).toBe(true);
      const bytes = fs.readFileSync(file);
      expect(bytes.byteLength, url).toBeLessThanOrEqual(400 * 1024);
      const size = imageSize(bytes);
      expect({ width: size.width, height: size.height }, url).toEqual(declared.get(url));
      expect(size.width, url).toBeLessThanOrEqual(1920);
    }
  });

  it.each(PRO)("%s : la bannière s'ouvre sur une photo de fond", (id) => {
    const hero = (templateById(id)!.data as { content: { type: string; props: { style: { background: string } } }[] }).content[0];
    expect(hero.type).toBe("Hero");
    expect(hero.props.style.background).toBe("image");
  });

  it.each(PRO)("%s : un aperçu existe pour la carte du formulaire", (id) => {
    const preview = templateById(id)!.preview;
    expect(preview).toBe(`/templates/${id}/apercu.webp`);
    expect(fs.existsSync(path.join(PUBLIC, preview!))).toBe(true);
  });
});

describe("un modèle devient la page du vendeur", () => {
  it.each(TEMPLATES.map((t) => [t.id, t] as const))("%s : l'onglet du navigateur prend le nom du site (titre vide)", (_id, template) => {
    expect((template.data as { root: { props: { title: string } } }).root.props.title).toBe("");
  });

  it("le pied de page porte le nom du site, sans toucher au modèle", () => {
    const template = templateById("mode")!;
    const before = JSON.stringify(template.data);
    const page = pageFromTemplate(template, "Boutique Amina") as { content: { type: string; props: { shopName?: string } }[] };
    expect(page.content.find((block) => block.type === "Footer")?.props.shopName).toBe("Boutique Amina");
    expect(JSON.stringify(template.data)).toBe(before);
  });
});
