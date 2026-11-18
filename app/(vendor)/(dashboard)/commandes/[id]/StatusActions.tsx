"use client";

// Boutons des seuls changements de statut permis, avec une note facultative.

import type { OrderStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { BTN_GHOST, BTN_PRIMARY, FIELD, HINT, LABEL, Notice } from "@/components/dashboard/ui";
import { ORDER_ACTION_LABELS } from "@/lib/orders/status";
import { setOrderStatus } from "./actions";

// Le pas « en avant » ressort ; annuler ou retourner reste discret.
const FORWARD = new Set<OrderStatus>(["CONFIRMED", "SHIPPED", "DELIVERED"]);

export function StatusActions({ orderId, next }: { orderId: string; next: readonly OrderStatus[] }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<OrderStatus | null>(null);

  if (next.length === 0) return <p className={HINT}>Statut définitif : plus aucun changement possible.</p>;

  function change(to: OrderStatus) {
    setError("");
    setTarget(to);
    startTransition(async () => {
      const result = await setOrderStatus(orderId, to, note.trim());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNote("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="status-note" className={LABEL}>Note (facultative)</label>
        <textarea
          id="status-note"
          className={`${FIELD} min-h-20`}
          maxLength={300}
          placeholder="Ex. : confirmée par téléphone, client absent…"
          value={note}
          disabled={pending}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {error && (
        <Notice tone="danger" icon={AlertTriangle} title="Changement impossible">
          {error}
        </Notice>
      )}
      <div className="flex flex-wrap gap-2">
        {next.map((to) => (
          <button key={to} type="button" className={FORWARD.has(to) ? BTN_PRIMARY : BTN_GHOST} disabled={pending} onClick={() => change(to)}>
            {pending && target === to && <Loader2 size={15} className="animate-spin" aria-hidden />}
            {ORDER_ACTION_LABELS[to]}
          </button>
        ))}
      </div>
    </div>
  );
}
