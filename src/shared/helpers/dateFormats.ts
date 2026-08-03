/**
 * ALL date formatting. Same rule as formatters.ts: never inside a component.
 *
 * Every function tolerates null/undefined and returns the em-dash placeholder,
 * so call sites never need a ternary.
 */
import dayjs from "dayjs";

const EMPTY = "—";

/** 2026-08-03T10:22:00Z → "03.08.2026" */
export const dateFormat = (value?: string | null): string =>
  value ? dayjs(value).format("DD.MM.YYYY") : EMPTY;

/** → "03.08.2026 15:22" */
export const fullDateFormat = (value?: string | null): string =>
  value ? dayjs(value).format("DD.MM.YYYY HH:mm") : EMPTY;

/** → "15:22" */
export const timeFormat = (value?: string | null): string =>
  value ? dayjs(value).format("HH:mm") : EMPTY;

/** Locale-aware long form: "3 avgust 2026" / "3 августа 2026" / "3 August 2026" */
export const localizedDateFormat = (
  value?: string | null,
  language: "uz" | "ru" | "en" = "uz",
): string => {
  if (!value) return EMPTY;
  const locale = language === "uz" ? "uz-UZ" : language === "ru" ? "ru-RU" : "en-US";
  return new Date(value).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/** For request bodies — the API format, never the display format. */
export const toApiDate = (value?: dayjs.Dayjs | string | null): string | undefined =>
  value ? dayjs(value).format("YYYY-MM-DD") : undefined;
