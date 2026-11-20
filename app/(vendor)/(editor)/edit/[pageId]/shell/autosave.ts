// Enregistrement automatique du brouillon : 2 s après la dernière modification,
// jamais deux envois à la fois. Une modification faite pendant un envoi repart
// après lui ; un échec est signalé et la modification suivante (ou flush)
// réessaie. flush() enregistre tout de suite : avant l'aperçu, la publication, Ctrl+S.

export type AutosaveStatus = "clean" | "pending" | "saving" | "saved" | "error";

type Options<T> = {
  save: (data: T) => Promise<boolean>;
  /** Version déjà enregistrée (la page chargée) : la recevoir de nouveau n'est pas une modification. */
  initial?: T;
  delayMs?: number;
  onStatus: (status: AutosaveStatus) => void;
};

export function createAutosave<T>({ save, initial, delayMs = 2000, onStatus }: Options<T>) {
  let lastSaved = initial === undefined ? undefined : JSON.stringify(initial);
  let latest: T | undefined;
  let dirty = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let inFlight: Promise<boolean> | null = null;

  const clearTimer = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  const schedule = () => {
    clearTimer();
    timer = setTimeout(() => {
      timer = undefined;
      void send();
    }, delayMs);
  };

  function send(): Promise<boolean> {
    if (inFlight) return inFlight;
    if (!dirty) return Promise.resolve(true);
    dirty = false;
    const data = latest as T;
    onStatus("saving");
    inFlight = save(data)
      .catch(() => false)
      .then((ok) => {
        inFlight = null;
        if (!ok) {
          dirty = true;
          onStatus("error");
          return false;
        }
        lastSaved = JSON.stringify(data);
        if (dirty) {
          onStatus("pending");
          schedule();
        } else {
          onStatus("saved");
        }
        return true;
      });
    return inFlight;
  }

  return {
    change(data: T) {
      if (!dirty && !inFlight && JSON.stringify(data) === lastSaved) return;
      latest = data;
      dirty = true;
      if (inFlight) return; // repart à la fin de l'envoi en cours
      onStatus("pending");
      schedule();
    },
    /** Enregistre tout de suite ; vrai si plus rien ne reste à enregistrer. */
    async flush(): Promise<boolean> {
      clearTimer();
      for (;;) {
        if (inFlight) await inFlight;
        if (!dirty) return true;
        clearTimer();
        if (!(await send())) return false;
      }
    },
    /** Version enregistrée par un autre chemin (publication). */
    markSaved(data: T) {
      lastSaved = JSON.stringify(data);
    },
    /** Rien n'attend d'être enregistré, ni ne l'est en ce moment. */
    isIdle: () => !dirty && !inFlight,
    dispose: clearTimer,
  };
}

export type Autosave<T> = ReturnType<typeof createAutosave<T>>;
