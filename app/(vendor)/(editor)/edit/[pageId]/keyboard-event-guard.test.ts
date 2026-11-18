import { installKeyboardEventGuard } from "./keyboard-event-guard";

// Reproduit ce que fait Puck sur chaque keydown / keyup du document.
function puckLikeListener(target: EventTarget) {
  const seen: boolean[] = [];
  const listener = (e: Event) => seen.push((e as KeyboardEvent).getModifierState("AltGraph"));
  target.addEventListener("keydown", listener);
  target.addEventListener("keyup", listener);
  return seen;
}

it("donne getModifierState aux keydown/keyup qui ne sont pas des KeyboardEvent", () => {
  const target = new EventTarget();
  const uninstall = installKeyboardEventGuard(target);
  const seen = puckLikeListener(target);

  // Sans la garde, ces deux appels lèveraient « e.getModifierState is not a function ».
  target.dispatchEvent(new Event("keydown"));
  target.dispatchEvent(new Event("keyup"));

  expect(seen).toEqual([false, false]);
  uninstall();
});

it("ne touche pas un événement qui a déjà getModifierState", () => {
  const target = new EventTarget();
  const uninstall = installKeyboardEventGuard(target);
  const real = Object.assign(new Event("keydown"), { getModifierState: (key: string) => key === "AltGraph" });
  const seen = puckLikeListener(target);

  target.dispatchEvent(real);

  expect(seen).toEqual([true]);
  uninstall();
});

it("se retire proprement", () => {
  const target = new EventTarget();
  installKeyboardEventGuard(target)();
  const seen: unknown[] = [];
  target.addEventListener("keydown", (e) => seen.push((e as Partial<KeyboardEvent>).getModifierState));

  target.dispatchEvent(new Event("keydown"));

  expect(seen).toEqual([undefined]);
});
