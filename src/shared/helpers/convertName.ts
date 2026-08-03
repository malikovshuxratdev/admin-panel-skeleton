/**
 * Localized-value resolution. The ONLY correct way to read a trilingual field.
 *
 * Rules:
 *   - Handles null/undefined itself and returns "". Do NOT wrap it in a local
 *     `getLocalizedValue` guard — that duplication is an anti-pattern.
 *   - Falls back across languages so a half-filled record still renders.
 */
export type NameType = {
  uz?: string | null;
  ru?: string | null;
  en?: string | null;
};

const filled = (s: string | null | undefined): boolean => !!s && s.trim() !== "";

export const getNameByLanguage = (
  name: NameType | null | undefined,
  currentLanguage: "uz" | "ru" | "en",
): string => {
  if (!name) return "";
  if (filled(name[currentLanguage])) return name[currentLanguage]!;
  for (const lang of ["uz", "ru", "en"] as const) {
    if (filled(name[lang])) return name[lang]!;
  }
  return "";
};
