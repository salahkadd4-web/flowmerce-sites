import { renderToStaticMarkup } from "react-dom/server";
import { Palette } from "lucide-react";
import { ColorSwatches } from "./ColorSwatches";
import { Popover } from "./Popover";
import { SegmentedChoice } from "./SegmentedChoice";
import { ToolbarButton } from "./ToolbarButton";

describe("ToolbarButton", () => {
  it("porte son nom en clair (lecteur d'écran et infobulle)", () => {
    const html = renderToStaticMarkup(<ToolbarButton label="Dupliquer la section" icon={Palette} onClick={() => {}} />);
    expect(html).toContain('aria-label="Dupliquer la section"');
    expect(html).toContain('title="Dupliquer la section"');
    expect(html).not.toContain("aria-pressed");
  });

  it("dit s'il est enfoncé quand c'est un interrupteur", () => {
    const html = renderToStaticMarkup(<ToolbarButton label="Gras" icon={Palette} active onClick={() => {}} />);
    expect(html).toContain('aria-pressed="true"');
  });
});

describe("Popover", () => {
  it("fermée : un bouton qui annonce sa fenêtre, sans la fenêtre", () => {
    const html = renderToStaticMarkup(
      <Popover label="Fond de la section" icon={Palette} text="Fond">
        <p>contenu</p>
      </Popover>,
    );
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("Fond");
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain("contenu");
  });
});

describe("ColorSwatches", () => {
  it("Automatique, les 8 couleurs du thème et une couleur personnalisée", () => {
    const html = renderToStaticMarkup(<ColorSwatches label="Couleur du titre" value="#16265c" onChange={() => {}} allowAuto />);
    expect(html.match(/<button/g)).toHaveLength(9);
    expect(html.match(/type="color"/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Nuit" aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
  });

  it("sans Automatique quand la couleur doit être fixée", () => {
    const html = renderToStaticMarkup(<ColorSwatches label="Fond" value="#ffffff" onChange={() => {}} />);
    expect(html.match(/<button/g)).toHaveLength(8);
  });
});

describe("SegmentedChoice", () => {
  it("un groupe de choix exclusifs, le choix courant coché", () => {
    const html = renderToStaticMarkup(
      <SegmentedChoice
        label="Espacement"
        value="normal"
        onChange={() => {}}
        options={[
          { value: "compact", label: "Compact" },
          { value: "normal", label: "Normal" },
        ]}
      />,
    );
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="Espacement"');
    expect(html).toMatch(/aria-checked="true"[^>]*>Normal</);
    expect(html).toMatch(/aria-checked="false"[^>]*>Compact</);
  });
});
