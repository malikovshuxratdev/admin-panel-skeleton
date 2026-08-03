// Public surface of the _template feature.
// Nothing outside this feature may import any other path under `_template/`.
//
// Rules for this file:
//   - It is a CONTRACT, not a convenience. Export what neighbours genuinely
//     need — pages that `Routes.tsx` cannot lazy-import, hooks and types other
//     features consume — and nothing else.
//   - Every export needs a real consumer outside this feature. An export with
//     no consumer is dead code that looks alive; delete it.
//   - Point at the real module. Never create a re-export shim file.
//   - A feature with no cross-feature consumer needs no barrel at all.

export {
  useTemplateListQuery,
  useTemplateDetailQuery,
  useTemplateCreateMutation,
  useTemplateUpdateMutation,
  useTemplateDeleteMutation,
} from "@/features/_template/hooks";

export type {
  TemplateItem,
  TemplateDetail,
  TemplateListParams,
} from "@/features/_template/types";
