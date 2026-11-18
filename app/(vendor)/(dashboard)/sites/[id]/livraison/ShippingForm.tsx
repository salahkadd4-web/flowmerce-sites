"use client";

// Frais de livraison des 69 wilayas : domicile (vide = non desservie) et bureau
// (facultatif). « Appliquer à toutes » remplit le tableau en une fois.

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { BTN_GHOST, BTN_PRIMARY, CardTitle, FIELD, HINT, LABEL, Notice } from "@/components/dashboard/ui";
import type { ShippingRow } from "@/lib/shipping";
import { saveShipping } from "./actions";

type Row = { wilayaCode: number; name: string; home: string; office: string };

const digits = (value: string) => value.replace(/[^\d]/g, "").slice(0, 6);
const toNumber = (value: string) => (value === "" ? null : Number(value));

export function ShippingForm({ siteId, initial }: { siteId: string; initial: ShippingRow[] }) {
  const [rows, setRows] = useState<Row[]>(
    initial.map((r) => ({ wilayaCode: r.wilayaCode, name: r.name, home: r.home?.toString() ?? "", office: r.office?.toString() ?? "" })),
  );
  const [allHome, setAllHome] = useState("");
  const [allOffice, setAllOffice] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const served = rows.filter((r) => r.home !== "").length;

  const update = (code: number, field: "home" | "office", value: string) => {
    setResult(null);
    setRows((list) => list.map((r) => (r.wilayaCode === code ? { ...r, [field]: digits(value) } : r)));
  };

  function save() {
    setResult(null);
    startTransition(async () => {
      const response = await saveShipping(
        siteId,
        rows.map((r) => ({ wilayaCode: r.wilayaCode, home: toNumber(r.home), office: r.home === "" ? null : toNumber(r.office) })),
      );
      setResult(response.ok ? { ok: true, message: "Frais de livraison enregistrés." } : { ok: false, message: response.error });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <CardTitle>Appliquer à toutes les wilayas</CardTitle>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="all-home" className={LABEL}>Domicile (DA)</label>
            <input id="all-home" className={FIELD} inputMode="numeric" value={allHome} onChange={(e) => setAllHome(digits(e.target.value))} />
          </div>
          <div>
            <label htmlFor="all-office" className={LABEL}>Bureau (DA, facultatif)</label>
            <input id="all-office" className={FIELD} inputMode="numeric" value={allOffice} onChange={(e) => setAllOffice(digits(e.target.value))} />
          </div>
          <button
            type="button"
            className={BTN_GHOST}
            disabled={pending || allHome === ""}
            onClick={() => {
              setResult(null);
              setRows((list) => list.map((r) => ({ ...r, home: allHome, office: allOffice })));
            }}
          >
            Appliquer à toutes
          </button>
        </div>
      </div>

      <div>
        <CardTitle aside={<span className="text-[12px] text-body">{served} wilaya{served !== 1 ? "s" : ""} desservie{served !== 1 ? "s" : ""}</span>}>
          Frais par wilaya
        </CardTitle>
        <p className={`${HINT} mb-3`}>Laissez « Domicile » vide pour ne pas livrer une wilaya : elle n&apos;est plus proposée aux acheteurs.</p>
        <div className="overflow-x-auto rounded-control border border-line">
          <table className="w-full text-[14px]">
            <thead className="bg-page text-left text-[12px] font-semibold text-body">
              <tr>
                <th scope="col" className="px-3 py-2">Wilaya</th>
                <th scope="col" className="px-3 py-2">Domicile (DA)</th>
                <th scope="col" className="px-3 py-2">Bureau (DA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.wilayaCode}>
                  <th scope="row" className="px-3 py-1.5 text-left font-medium text-ink">
                    <span className="mr-2 tabular-nums text-faint">{String(r.wilayaCode).padStart(2, "0")}</span>
                    {r.name}
                  </th>
                  <td className="px-3 py-1.5">
                    <input aria-label={`Domicile — ${r.name}`} className={`${FIELD} w-28`} inputMode="numeric" value={r.home} disabled={pending} onChange={(e) => update(r.wilayaCode, "home", e.target.value)} />
                  </td>
                  <td className="px-3 py-1.5">
                    <input aria-label={`Bureau — ${r.name}`} className={`${FIELD} w-28`} inputMode="numeric" value={r.office} disabled={pending || r.home === ""} onChange={(e) => update(r.wilayaCode, "office", e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {result &&
        (result.ok ? (
          <p role="status" className="flex items-center gap-2 text-[13px] font-medium text-green-800">
            <CheckCircle2 size={15} aria-hidden />
            {result.message}
          </p>
        ) : (
          <Notice tone="danger" icon={AlertTriangle} title="Enregistrement impossible">
            {result.message}
          </Notice>
        ))}

      <div>
        <button type="button" className={BTN_PRIMARY} disabled={pending} onClick={save}>
          {pending && <Loader2 size={15} className="animate-spin" aria-hidden />}
          {pending ? "Enregistrement" : "Enregistrer les frais"}
        </button>
      </div>
    </div>
  );
}
