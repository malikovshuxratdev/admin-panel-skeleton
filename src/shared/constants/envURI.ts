/**
 * Every `import.meta.env` read in the application happens here.
 *
 * Rules:
 *   - No component, hook or api module reads `import.meta.env` directly.
 *   - Every variable used here must exist in `.env.example`.
 */
export const BASE_URI = `${import.meta.env.VITE_BASE_URI}/api`;
export const FILE_URI = import.meta.env.VITE_FILE_URI;
export const OAUTH_URI = import.meta.env.VITE_OAUTH_URI;
