import { parsePageContent } from "@/lib/page-content";

const VALID = {
  root: { props: { title: "Accueil" } },
  content: [
    { type: "Heading", props: { id: "h1", text: "Bienvenue sur la boutique test" } },
    { type: "Text", props: { id: "t1", text: "Cette page est lue en base." } },
  ],
};

it("accepte le contenu de départ", () => {
  const parsed = parsePageContent(VALID);
  expect(parsed?.content).toHaveLength(2);
  expect(parsed?.root.props.title).toBe("Accueil");
});

it("complète un root absent", () => {
  expect(parsePageContent({ content: [] })).toEqual({ root: { props: {} }, content: [] });
});

it("refuse un contenu sans tableau content", () => {
  expect(parsePageContent({ root: { props: {} } })).toBeNull();
  expect(parsePageContent({ content: "pas un tableau" })).toBeNull();
});

it("refuse ce qui n'est pas un objet", () => {
  expect(parsePageContent("texte")).toBeNull();
  expect(parsePageContent(null)).toBeNull();
  expect(parsePageContent(42)).toBeNull();
});

it("conserve un bloc de type inconnu", () => {
  const parsed = parsePageContent({ content: [{ type: "Inconnu", props: {} }] });
  expect(parsed?.content).toEqual([{ type: "Inconnu", props: {} }]);
});
