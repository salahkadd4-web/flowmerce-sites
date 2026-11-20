"use client";

// Champ de saisie d'une fenêtre de l'éditeur. La valeur s'écrit dans la page à la
// sortie du champ (ou Entrée) : une seule étape d'historique par saisie, pas une
// par lettre. Une erreur (lien refusé…) s'affiche sous le champ, rien n'est écrit.

import { useId, useState } from "react";

type Props = {
  label: string;
  value: string;
  onCommit: (value: string) => void;
  /** Message d'erreur de la valeur saisie, ou null si elle est acceptable. */
  validate?: (value: string) => string | null;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url";
  hint?: string;
};

export function TextInput({ label, value, onCommit, validate, placeholder, type = "text", hint }: Props) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  // Valeur changée ailleurs (Ctrl+Z…) : le champ la reprend.
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    setShown(value);
    setDraft(value);
    setError(null);
  }

  const commit = () => {
    const next = draft.trim();
    const problem = validate?.(next) ?? null;
    setError(problem);
    if (problem === null && next !== value) onCommit(next);
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-semibold text-body">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={draft}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-[13px] text-ink placeholder:text-faint focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-brand/30"
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[12px] font-medium text-red-700">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-[12px] text-faint">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
