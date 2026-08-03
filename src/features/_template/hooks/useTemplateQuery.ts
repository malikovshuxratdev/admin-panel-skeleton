/**
 * TEMPLATE — one hooks file per domain concern.
 *
 * Rules for this layer:
 *   - Every exported hook ends in `Query` or `Mutation`. Never `Mutate`,
 *     never a bare `useTemplate`.
 *   - This layer unwraps `.data`; components never see the axios envelope.
 *   - Mutations invalidate the query keys they affect. A mutation that
 *     changes server state and invalidates nothing is a bug.
 *   - When this file passes ~400 lines, split by concern into
 *     `useTemplate<Concern>Query.ts` — do not let it grow into a catch-all.
 */
import { useQuery, useMutation, useQueryClient } from "@/shared/hooks";
import { templateApi } from "@/features/_template/api";
import type {
  TemplateListParams,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from "@/features/_template/types";

export const useTemplateListQuery = (params: TemplateListParams) =>
  useQuery({
    queryKey: ["template", "list", params],
    queryFn: () => templateApi.getList(params).then((r) => r.data),
  });

export const useTemplateDetailQuery = (id: number | undefined) =>
  useQuery({
    queryKey: ["template", "detail", id],
    queryFn: () => templateApi.getDetail(id!).then((r) => r.data),
    enabled: !!id,
  });

export const useTemplateCreateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTemplateRequest) => templateApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["template", "list"] }),
  });
};

export const useTemplateUpdateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateTemplateRequest }) =>
      templateApi.update(id, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["template", "list"] });
      queryClient.invalidateQueries({ queryKey: ["template", "detail", id] });
    },
  });
};

export const useTemplateDeleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => templateApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["template", "list"] }),
  });
};
