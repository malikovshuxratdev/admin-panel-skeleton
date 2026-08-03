/**
 * ALL value formatting in the application lives here.
 *
 * THE RULE: a component MUST NOT format. If you are about to write
 * `.toFixed()`, `.replace(/\D/g, "")`, `.slice()`, `Intl.NumberFormat`,
 * `toLocaleString()` or a `padStart()` inside a component, an input, or a
 * table column — stop. It belongs in this file, under a name.
 *
 * Why: the same money value must render identically in a table cell, a card,
 * a PDF export and a form field. Formatting written at the call site drifts
 * apart within weeks, and nobody can find every copy to fix a rounding bug.
 */

/** 1234567.5 → "1 234 567,50" */
export const formatMoney = (value?: number | string | null, fractionDigits = 2): string => {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return n
    .toFixed(fractionDigits)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

/** Live input masking: "1234567" → "1 234 567". Use in onChange, never inline. */
export const formatMoneyInput = (value?: string): string => {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

/** Strips a formatted money string back to a number for the request body. */
export const parseMoneyInput = (value?: string): number =>
  Number((value ?? "").replace(/\s/g, "").replace(",", ".")) || 0;

/** "998901234567" → "+998 (90) 123-45-67" */
export const formatPhoneNumber = (value?: string | null): string => {
  const d = (value ?? "").replace(/\D/g, "");
  if (d.length !== 12) return value ?? "—";
  return `+${d.slice(0, 3)} (${d.slice(3, 5)}) ${d.slice(5, 8)}-${d.slice(8, 10)}-${d.slice(10)}`;
};

/** "123456789" → "123 456 789" */
export const formatTIN = (value?: string | number | null): string => {
  const d = String(value ?? "").replace(/\D/g, "");
  return d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "—";
};

/** 1536 → "1.5 KB" */
export const formatFileSize = (bytes?: number | null): string => {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

/** 0.4213 → "42.13%" */
export const formatPercent = (ratio?: number | null, fractionDigits = 2): string =>
  ratio === null || ratio === undefined ? "—" : `${(ratio * 100).toFixed(fractionDigits)}%`;

/** Long text for a table cell: "Lorem ipsum dolor…" */
export const truncate = (value?: string | null, max = 60): string => {
  if (!value) return "—";
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
};

/** "  hello   world " → "hello world"; empty becomes undefined for query params. */
export const normalizeText = (value?: string | null, fallback?: string): string | undefined => {
  const trimmed = (value ?? "").trim().replace(/\s+/g, " ");
  return trimmed === "" ? fallback : trimmed;
};
