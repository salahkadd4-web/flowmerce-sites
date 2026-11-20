import { createAutosave, type AutosaveStatus } from "./autosave";

function setup(results: boolean[] = [], initial?: unknown) {
  const saved: unknown[] = [];
  const pending: Array<(ok: boolean) => void> = [];
  const statuses: AutosaveStatus[] = [];
  const autosave = createAutosave({
    delayMs: 2000,
    initial,
    onStatus: (status) => statuses.push(status),
    save: (data) => {
      saved.push(data);
      return new Promise<boolean>((resolve) => {
        const next = results.shift();
        if (next === undefined) pending.push(resolve);
        else resolve(next);
      });
    },
  });
  return { autosave, saved, pending, statuses };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("createAutosave", () => {
  it("regroupe les modifications rapprochées en un seul enregistrement, avec la dernière version", async () => {
    const { autosave, saved, statuses } = setup([true]);
    autosave.change({ v: 1 });
    await vi.advanceTimersByTimeAsync(1000);
    autosave.change({ v: 2 });
    await vi.advanceTimersByTimeAsync(1000);
    autosave.change({ v: 3 });
    expect(saved).toEqual([]);
    expect(statuses.at(-1)).toBe("pending");
    await vi.advanceTimersByTimeAsync(2000);
    expect(saved).toEqual([{ v: 3 }]);
    expect(statuses.at(-1)).toBe("saved");
  });

  it("n'enregistre jamais deux fois à la fois ; une modification pendant l'envoi repart ensuite", async () => {
    const { autosave, saved, pending } = setup();
    autosave.change({ v: 1 });
    await vi.advanceTimersByTimeAsync(2000);
    expect(saved).toEqual([{ v: 1 }]);
    autosave.change({ v: 2 });
    await vi.advanceTimersByTimeAsync(5000);
    expect(saved).toHaveLength(1);
    pending.shift()!(true);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(2000);
    expect(saved).toEqual([{ v: 1 }, { v: 2 }]);
  });

  it("signale l'échec, et la modification suivante réessaie", async () => {
    const { autosave, saved, statuses } = setup([false, true]);
    autosave.change({ v: 1 });
    await vi.advanceTimersByTimeAsync(2000);
    expect(statuses.at(-1)).toBe("error");
    autosave.change({ v: 2 });
    await vi.advanceTimersByTimeAsync(2000);
    expect(saved).toEqual([{ v: 1 }, { v: 2 }]);
    expect(statuses.at(-1)).toBe("saved");
  });

  it("flush enregistre tout de suite et dit si tout est enregistré", async () => {
    const { autosave, saved } = setup([true]);
    autosave.change({ v: 1 });
    const done = autosave.flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(saved).toEqual([{ v: 1 }]);
    await expect(done).resolves.toBe(true);
    await vi.advanceTimersByTimeAsync(5000);
    expect(saved).toHaveLength(1);
  });

  it("flush après un échec réessaie la dernière version", async () => {
    const { autosave, saved } = setup([false, true]);
    autosave.change({ v: 1 });
    await vi.advanceTimersByTimeAsync(2000);
    await expect(autosave.flush()).resolves.toBe(true);
    expect(saved).toEqual([{ v: 1 }, { v: 1 }]);
  });

  it("flush sans rien à enregistrer répond tout de suite", async () => {
    const { autosave, saved } = setup();
    await expect(autosave.flush()).resolves.toBe(true);
    expect(saved).toEqual([]);
  });

  it("ignore une version identique à la dernière enregistrée (chargement de la page)", async () => {
    const { autosave, saved, statuses } = setup([true], { v: 1 });
    autosave.change({ v: 1 });
    await vi.advanceTimersByTimeAsync(5000);
    expect(saved).toEqual([]);
    expect(statuses).toEqual([]);
  });

  it("après une publication, la version publiée compte comme enregistrée", async () => {
    const { autosave, saved } = setup([true]);
    autosave.markSaved({ v: 7 });
    autosave.change({ v: 7 });
    await vi.advanceTimersByTimeAsync(5000);
    expect(saved).toEqual([]);
  });
});
