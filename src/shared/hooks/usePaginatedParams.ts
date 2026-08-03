/**
 * Pagination + filter state for a list screen, persisted per screen.
 *
 * Rules:
 *   - Use this instead of a local `useState` pair. It keeps the page on
 *     remount and resets to page 1 whenever a filter changes.
 *   - Pass `setPage` / `setPageSize` straight to DataTable. Never wrap them in
 *     a pass-through useCallback.
 */
import { useCallback, useState } from "react";

export interface BasePaginatedParams {
  page: number;
  page_size: number;
}

export const usePaginatedParams = <T extends BasePaginatedParams>(
  storageKey: string,
  initial: T,
) => {
  const [params, setParams] = useState<T>(() => {
    const saved = sessionStorage.getItem(storageKey);
    return saved ? { ...initial, ...JSON.parse(saved) } : initial;
  });

  const update = useCallback(
    (next: (prev: T) => T) =>
      setParams((prev) => {
        const value = next(prev);
        sessionStorage.setItem(storageKey, JSON.stringify(value));
        return value;
      }),
    [storageKey],
  );

  const setPage = useCallback((page: number) => update((p) => ({ ...p, page })), [update]);

  const setPageSize = useCallback(
    (page_size: number) => update((p) => ({ ...p, page_size, page: 1 })),
    [update],
  );

  return { params, setParams: update, setPage, setPageSize };
};

/** Reconciles the page the server answered with against the one we asked for. */
export const buildPagination = ({
  pageSize,
  total,
  serverPage,
  requestedPage,
}: {
  pageSize: number;
  total?: number;
  serverPage?: number;
  requestedPage: number;
}) => ({
  page: serverPage ?? requestedPage,
  pageSize,
  total: total ?? 0,
});
