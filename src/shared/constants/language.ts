/**
 * The ONLY place allowed to read `i18n.language`.
 *
 * Rules:
 *   - Components call `useCurrentLanguage()`. Deriving the language by hand
 *     (`i18n.language.slice(0, 2)`) is forbidden — it silently breaks on
 *     region codes like `ru-RU`.
 *   - `getNameByLanguage` already handles null/undefined; do not wrap it in a
 *     local `getLocalizedValue` guard.
 */
import { useTranslation } from "react-i18next";

export const LANGUAGES = ["uz", "ru", "en"] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = "uz";

export const useCurrentLanguage = (): Language => {
  const { i18n } = useTranslation();
  const current = i18n.language?.split("-")[0] as Language | undefined;
  return current && LANGUAGES.includes(current) ? current : DEFAULT_LANGUAGE;
};
