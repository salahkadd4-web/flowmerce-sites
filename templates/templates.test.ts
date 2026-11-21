import { validatePageContent } from "@/lib/page-content";
import { templateById, TEMPLATES } from "./index";

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
