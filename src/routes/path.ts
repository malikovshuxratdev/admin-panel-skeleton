/**
 * Every route path in the application, in one object.
 *
 * Rules:
 *   - A path string appears here and NOWHERE else. No `navigate("/x/" + id)`
 *     anywhere in the codebase.
 *   - Parameterised paths keep their `:param` and are filled at the call site:
 *       navigate(paths.TEMPLATE_DETAIL.replace(":id", String(id)))
 *   - Keys are SCREAMING_SNAKE_CASE and describe the screen, not the URL.
 */
const paths = {
  LOGIN: "/login",
  ROLE_SELECT: "/role-select",

  DASHBOARD: "/",
  PROFILE: "/profile",

  TEMPLATE: "/template",
  TEMPLATE_CREATE: "/template/create",
  TEMPLATE_DETAIL: "/template/:id",
  TEMPLATE_UPDATE: "/template/:id/update",

  NOT_FOUND: "*",
} as const;

export default paths;
