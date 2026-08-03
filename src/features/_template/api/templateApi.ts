/**
 * TEMPLATE — copy this file when creating a feature, then replace every
 * occurrence of `template` / `Template` with your domain name.
 *
 * Rules for this layer:
 *   - This is the ONLY layer allowed to touch `baseApiClient`.
 *   - Every URL lives in the local `urls` object. No inline URL strings.
 *   - No React here: no hooks, no state, no components.
 *   - Return the axios promise; do NOT unwrap `.data` (the hook layer does that).
 */
import { baseApiClient } from "@/shared/api";
import type {
  TemplateDetail,
  TemplateListParams,
  TemplateListResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from "@/features/_template/types";

const urls = {
  getList: "/template/list",
  getDetail: (id: number) => `/template/detail/${id}`,
  create: "/template/create",
  update: (id: number) => `/template/update/${id}`,
  delete: (id: number) => `/template/delete/${id}`,
};

export const templateApi = {
  getList: (params?: TemplateListParams) =>
    baseApiClient.get<TemplateListResponse, TemplateListParams, undefined>(urls.getList, params),

  getDetail: (id: number) =>
    baseApiClient.get<TemplateDetail, undefined, undefined>(urls.getDetail(id)),

  create: (body: CreateTemplateRequest) =>
    baseApiClient.post<TemplateDetail, CreateTemplateRequest>(urls.create, body),

  update: (id: number, body: UpdateTemplateRequest) =>
    baseApiClient.put<TemplateDetail, UpdateTemplateRequest>(urls.update(id), body),

  delete: (id: number) => baseApiClient.delete<void, undefined>(urls.delete(id)),
};
