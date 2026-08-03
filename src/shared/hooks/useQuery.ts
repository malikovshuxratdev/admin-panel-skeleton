/**
 * The single entry point to react-query.
 *
 * Rules:
 *   - Features import from here, never from "@tanstack/react-query" directly.
 *     One indirection means a version bump or a default change is one edit.
 *   - Do not add domain logic here. This file only re-exports and sets defaults.
 */
export {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
