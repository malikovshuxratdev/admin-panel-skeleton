/**
 * Every route of the application, in one object. There is no second list.
 *
 * Two things are needed and they are NOT the same:
 *
 *   - `paths` — the PATTERN (`/template/:id`). `Routes.tsx` registers these.
 *   - `to`    — the BUILDER (`to.templateDetail(7)` → `/template/7`).
 *               Everything that navigates uses these.
 *
 * Builders are derived from the patterns, never written twice. Two hand-kept
 * lists drift: rename a pattern's `:id` to `:journalId` and every
 * `.replace(":id", …)` in the codebase silently produces a URL containing the
 * literal text `:journalId` — no compiler error, no crash, just a 404 a user
 * finds before you do.
 *
 * Rules:
 *   - A path string appears HERE and nowhere else.
 *   - Keys are SCREAMING_SNAKE_CASE and name the screen, not the URL.
 *   - Navigation goes through `to.*`, never `paths.*` + `.replace()`.
 *   - These are SITE routes. Backend endpoints live in each feature's `api/`
 *     module under its own `urls` object — a different namespace that changes
 *     for different reasons.
 */

const paths = {
  // public — reachable without a session
  LOGIN: "/login",
  ROLE_SELECT: "/role-select",

  // authenticated
  DASHBOARD: "/",
  PROFILE: "/profile",

  TEMPLATE: "/template",
  TEMPLATE_CREATE: "/template/create",
  TEMPLATE_DETAIL: "/template/:id",
  TEMPLATE_UPDATE: "/template/:id/update",

  NOT_FOUND: "*",
} as const;

export default paths;

/** Routes that must stay reachable without a session — read by the auth guard. */
export const PUBLIC_PATHS: string[] = [paths.LOGIN, paths.ROLE_SELECT];

/* ────────────────────────────────────────────────────────────────────────── */

/** Extracts `"id"` from `"/template/:id/update"` at the type level. */
type PathParam<T extends string> = T extends `${string}:${infer P}/${infer Rest}`
  ? P | PathParam<`/${Rest}`>
  : T extends `${string}:${infer P}`
    ? P
    : never;

type ParamsOf<T extends string> = [PathParam<T>] extends [never]
  ? void
  : Record<PathParam<T>, string | number>;

/**
 * Fills a pattern from its params.
 *
 * The signature is what earns its keep: `ParamsOf` reads the parameter names
 * out of the pattern string itself, so passing the wrong key — or forgetting
 * one — is a compile error rather than a broken URL at runtime.
 */
export const buildPath = <T extends string>(pattern: T, params: ParamsOf<T>): string => {
  if (!params) return pattern;
  return Object.entries(params as Record<string, string | number>).reduce(
    (acc, [key, value]) => acc.replace(`:${key}`, String(value)),
    pattern as string,
  );
};

/**
 * The navigation surface. Add a builder here for every parameterised route.
 * Static routes are used directly: `navigate(paths.TEMPLATE)`.
 */
export const to = {
  templateDetail: (id: string | number) => buildPath(paths.TEMPLATE_DETAIL, { id }),
  templateUpdate: (id: string | number) => buildPath(paths.TEMPLATE_UPDATE, { id }),
};
