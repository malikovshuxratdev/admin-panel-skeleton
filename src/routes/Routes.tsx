/**
 * The router. This is the ONLY file allowed to deep-import a feature's pages.
 *
 * Why the exception: going through `@/features/x` here would pull that
 * feature's entire public surface into the lazy chunk and undo code splitting
 * for every route at once.
 *
 * Rules:
 *   - Deep imports here are limited to `pages/` modules. Never reach into a
 *     feature's `api/`, `hooks/`, `components/` or `types/` from this file.
 *   - Paths come from `paths.*`. No literal strings in route definitions.
 *   - Role restrictions belong to a layout, not to individual routes.
 */
import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import paths from "@/routes/path";
import { AdminLayout } from "@/layout/admin-layout";

const TemplatePage = lazy(() => import("@/features/_template/pages/TemplatePage"));

export const router = createBrowserRouter([
  {
    element: <AdminLayout />,
    children: [{ path: paths.TEMPLATE, element: <TemplatePage /> }],
  },
]);
