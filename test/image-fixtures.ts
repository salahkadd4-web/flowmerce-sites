// Images minimales (1×1) pour les tests, encodées en base64 : pas de binaire versionné.

const b64 = (value: string) => new Uint8Array(Buffer.from(value, "base64"));

export const PNG_1X1 = b64(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
);

export const JPEG_1X1 = b64(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
);

export const WEBP_1X1 = b64("UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=");

export const SVG = new Uint8Array(
  Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>'),
);

export const TEXT = new Uint8Array(Buffer.from("bonjour"));
