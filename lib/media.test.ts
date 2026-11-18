import { inspectImage, isMediaKey, MAX_MEDIA_BYTES } from "@/lib/media";
import { JPEG_1X1, PNG_1X1, SVG, TEXT, WEBP_1X1 } from "@/test/image-fixtures";

describe("inspectImage", () => {
  it("reconnaît un PNG par son contenu", () => {
    expect(inspectImage(PNG_1X1)).toEqual({ ok: true, ext: "png", mimeType: "image/png", width: 1, height: 1 });
  });

  it("reconnaît un JPEG et un WebP", () => {
    expect(inspectImage(JPEG_1X1)).toMatchObject({ ok: true, ext: "jpg", mimeType: "image/jpeg" });
    expect(inspectImage(WEBP_1X1)).toMatchObject({ ok: true, ext: "webp", mimeType: "image/webp" });
  });

  it("refuse un SVG, même valide", () => {
    expect(inspectImage(SVG)).toEqual({ ok: false, error: "Format non pris en charge : JPEG, PNG, WebP ou AVIF" });
  });

  it("refuse un fichier qui n'est pas une image", () => {
    expect(inspectImage(TEXT)).toEqual({ ok: false, error: "Format non pris en charge : JPEG, PNG, WebP ou AVIF" });
  });

  it("refuse une image de plus de 5 Mo", () => {
    const tooBig = new Uint8Array(MAX_MEDIA_BYTES + 1);
    tooBig.set(PNG_1X1);
    expect(inspectImage(tooBig)).toEqual({ ok: false, error: "Image trop lourde (5 Mo maximum)" });
  });

  it("accepte une image de 5 Mo exactement", () => {
    const limit = new Uint8Array(MAX_MEDIA_BYTES);
    limit.set(PNG_1X1);
    expect(inspectImage(limit).ok).toBe(true);
  });

  it("refuse un fichier vide", () => {
    expect(inspectImage(new Uint8Array(0)).ok).toBe(false);
  });
});

describe("isMediaKey", () => {
  it("accepte une clé générée", () => {
    expect(isMediaKey("a".repeat(32) + ".png")).toBe(true);
    expect(isMediaKey("0123456789abcdef0123456789abcdef.webp")).toBe(true);
  });

  it.each(["../../etc/passwd", "a".repeat(32) + ".svg", "A".repeat(32) + ".png", "a".repeat(31) + ".png", "a".repeat(32) + ".png/x", ""])(
    "refuse %j",
    (key) => {
      expect(isMediaKey(key)).toBe(false);
    },
  );
});
