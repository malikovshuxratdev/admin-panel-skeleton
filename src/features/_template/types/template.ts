/**
 * TEMPLATE — request/response shapes for this domain.
 *
 * Rules for this layer:
 *   - NO `Type` suffix on the filename. The folder already says `types`.
 *     `template.ts`, not `templateType.ts`.
 *   - Interfaces are PascalCase.
 *   - One file per shape family. Split into `templateDetail.ts`,
 *     `templateList.ts` when a single file covers unrelated shapes.
 *   - Types describe the wire format. Do not put helpers or logic here.
 */

/** Trilingual values come back as an object, never a plain string. */
export interface LocalizedName {
  uz: string | null;
  ru: string | null;
  en: string | null;
}

export interface TemplateItem {
  id: number;
  name: LocalizedName;
  is_active: boolean;
  created_at: string;
}

export interface TemplateDetail extends TemplateItem {
  description: LocalizedName;
  updated_at: string;
}

export interface TemplateListParams {
  page: number;
  page_size: number;
  search?: string;
}

export interface TemplateListResponse {
  items: TemplateItem[];
  total: number;
  page: number;
}

export interface CreateTemplateRequest {
  name: LocalizedName;
  description: LocalizedName;
  is_active: boolean;
}

export type UpdateTemplateRequest = Partial<CreateTemplateRequest>;
