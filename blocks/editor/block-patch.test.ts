import { DEFAULT_BUTTON, DEFAULT_SECTION_STYLE, DEFAULT_TYPOGRAPHY } from "@/blocks/style";
import { GROUP_DEFAULTS, readGroup, updateBlock, updateRoot, withPath } from "./block-patch";

describe("withPath", () => {
  it("écrit dans un groupe absent en partant de ses valeurs par défaut", () => {
    const next = withPath({}, "typography.titleSize", "l", GROUP_DEFAULTS);
    expect(next.typography).toEqual({ ...DEFAULT_TYPOGRAPHY, titleSize: "l" });
  });

  it("garde les autres réglages d'un groupe existant", () => {
    const next = withPath({ style: { background: "color", backgroundColor: "#000000" } }, "style.overlay", 40, GROUP_DEFAULTS);
    expect(next.style).toEqual({ ...DEFAULT_SECTION_STYLE, background: "color", backgroundColor: "#000000", overlay: 40 });
  });

  it("écrit un réglage simple sans toucher à l'objet d'origine", () => {
    const props = { title: "x" };
    const next = withPath(props, "buttonHref", "#commande");
    expect(next).toEqual({ title: "x", buttonHref: "#commande" });
    expect(props).toEqual({ title: "x" });
  });
});

describe("readGroup", () => {
  it("rend les valeurs par défaut d'un groupe absent, complétées sinon", () => {
    expect(readGroup({}, "button", DEFAULT_BUTTON)).toEqual(DEFAULT_BUTTON);
    expect(readGroup({ button: { size: "l" } }, "button", DEFAULT_BUTTON)).toEqual({ ...DEFAULT_BUTTON, size: "l" });
  });
});

function fakePuck() {
  const dispatch = vi.fn();
  const item = { type: "Hero", props: { id: "hero-1", title: "x" } };
  const root = { props: { title: "Page", lang: "fr" } };
  const getPuck = () =>
    ({
      dispatch,
      getItemById: (id: string) => (id === "hero-1" ? item : undefined),
      getSelectorForId: (id: string) => (id === "hero-1" ? { index: 2, zone: "root:default-zone" } : undefined),
      appState: { data: { root } },
    }) as never;
  return { dispatch, getPuck, item, root };
}

describe("updateBlock", () => {
  it("remplace le bloc par sa version modifiée (annulable par Ctrl+Z)", () => {
    const { dispatch, getPuck, item } = fakePuck();
    updateBlock(getPuck, "hero-1", (props) => ({ ...props, title: "y" }));
    expect(dispatch).toHaveBeenCalledWith({
      type: "replace",
      destinationIndex: 2,
      destinationZone: "root:default-zone",
      data: { ...item, props: { id: "hero-1", title: "y" } },
    });
  });

  it("ne fait rien pour un bloc inconnu", () => {
    const { dispatch, getPuck } = fakePuck();
    updateBlock(getPuck, "absent", (props) => props);
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("updateRoot", () => {
  it("remplace les réglages de la page", () => {
    const { dispatch, getPuck, root } = fakePuck();
    updateRoot(getPuck, (props) => ({ ...props, productId: "p1" }));
    expect(dispatch).toHaveBeenCalledWith({ type: "replaceRoot", root: { ...root, props: { ...root.props, productId: "p1" } } });
  });
});
