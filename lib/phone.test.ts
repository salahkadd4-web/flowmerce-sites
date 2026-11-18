import { normalizeAlgerianPhone } from "@/lib/phone";

it.each([
  ["0555 12 34 56", "+213555123456"],
  ["0661-22-33-44", "+213661223344"],
  ["07.70.11.22.33", "+213770112233"],
  ["+213 6 61 22 33 44", "+213661223344"],
  ["00213770112233", "+213770112233"],
  ["213555123456", "+213555123456"],
  ["021 23 45 67", "+21321234567"],
  ["(038) 12 34 56", "+21338123456"],
])("normalise %s", (input, expected) => {
  expect(normalizeAlgerianPhone(input)).toBe(expected);
});

it.each(["0812345678", "055512345", "05551234567", "0155123456", "abc", "", "+33612345678"])(
  "refuse %j",
  (input) => {
    expect(normalizeAlgerianPhone(input)).toBeNull();
  },
);
