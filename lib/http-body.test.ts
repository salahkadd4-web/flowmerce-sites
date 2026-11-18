import { readLimitedText } from "@/lib/http-body";

function streamRequest(chunks: string[], headers: Record<string, string> = {}) {
  let pulled = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (pulled < chunks.length) controller.enqueue(new TextEncoder().encode(chunks[pulled++]));
      else controller.close();
    },
  }, { highWaterMark: 0 }); // pas de pré-chargement : on mesure ce que lit le code
  const request = new Request("http://x/", { method: "POST", body, headers, duplex: "half" } as RequestInit);
  return { request, pulled: () => pulled };
}

it("lit un corps sous la limite", async () => {
  const { request } = streamRequest(["{\"a\":", "1}"]);
  expect(await readLimitedText(request, 100)).toEqual({ ok: true, text: "{\"a\":1}" });
});

it("refuse d'emblée un Content-Length trop grand, sans lire le corps", async () => {
  const { request, pulled } = streamRequest(["x"], { "content-length": "5000" });
  expect(await readLimitedText(request, 100)).toEqual({ ok: false });
  expect(pulled()).toBe(0);
});

it("s'arrête dès que le corps dépasse la limite, sans tout lire", async () => {
  const { request, pulled } = streamRequest(Array.from({ length: 50 }, () => "x".repeat(40)));
  expect(await readLimitedText(request, 100)).toEqual({ ok: false });
  expect(pulled()).toBeLessThan(10);
});

it("compte les octets, pas les caractères", async () => {
  const { request } = streamRequest(["é".repeat(60)]);
  expect(await readLimitedText(request, 100)).toEqual({ ok: false });
});
