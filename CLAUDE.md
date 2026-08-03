# <project-name>

<One line: what this admin panel is and which roles it serves.>
React + Vite + TypeScript, feature-first.

---

## How to work in this repository

You are the one writing the code here. The person giving you tasks describes **what** they
want, not how — the architecture below is the "how", and it is not negotiable.

### Every task, in order

```
1. READ     — this file. For anything structural, ARCHITECTURE.md too.
2. LOCATE   — find the feature that owns the domain. If none owns it, it is a new feature.
3. REUSE    — search before writing. `grep -rn "<thing>" src/shared src/features`
              If it already exists, use it. If it exists TWICE, extract it first.
4. IMPLEMENT — follow the layer order: types → api → hooks → components → pages → routes.
5. VERIFY   — run ALL of these. Every one must pass:
                 npm run typecheck
                 npm run lint
                 node scripts/audit.mjs
6. REPORT   — say what changed, what you verified, and what you did NOT do.
```

**Step 5 is not optional and its result is not assumed.** Run the commands, read the
output, and only then say the work is done. If a check fails, fix the cause — never the
check.

### Before writing any new file, ask in this order

| Question                                          | If yes                              |
| ------------------------------------------------- | ----------------------------------- |
| Does this already exist in `@/shared`?            | Use it. Do not write a second one.  |
| Does it exist in the feature that owns the domain?| Use it.                             |
| Does something like it exist in **two** places?   | Extract it first, then use it.      |
| Is it formatting a value?                         | It goes in `@/shared/helpers`.      |
| Is it a routed page?                              | `features/<d>/pages/<D>Page.tsx`.   |
| Would two features need it, domain-free?          | `@/shared`. Otherwise the feature.  |

### When the task and the architecture disagree

Do **not** silently pick one. Say so, propose the smallest change that satisfies both, and
ask. Examples of things to raise rather than decide alone:

- the task needs `shared/` to know about a domain
- the task needs one feature to reach inside another
- the task implies duplicating something that already exists
- a library the task needs is not in the stack table below

### Never do without being asked

- Install a new dependency.
- Change `tailwind.config.js` tokens, `tsconfig.json`, or the audit script.
- Rename or move an existing feature folder.
- Delete a file you did not create in this task.
- Commit, push, or open a PR.

### Reporting

State plainly what you changed and what you verified, with the command output that proves
it. If something is incomplete or you skipped part of the task, say which part and why —
do not round up to "done".

---

## Stack

| Tool                  | Version | Note                                        |
| --------------------- | ------- | ------------------------------------------- |
| React                 | 18      | SPA, no SSR                                 |
| Vite                  | 7       | `import.meta.env.VITE_*`                    |
| TypeScript            | 5       | strict                                      |
| Tailwind CSS          | 3       | tokens in `tailwind.config.js`              |
| Ant Design            | 5       | Table, Form, Modal, Drawer, notification    |
| @tanstack/react-query | 5       | all server state                            |
| react-hook-form + zod | 7 / 4   | forms and validation                        |
| react-router-dom      | 7       | `createBrowserRouter`                       |
| axios                 | latest  | singleton in `shared/api/baseClient.ts`     |
| react-redux           | 9       | UI/form state only                          |
| react-i18next         | 16      | uz (default) / ru / en                      |

---

## Structure

```
app/ → routes/ → layout/ → features/ ⇄ shared/
```

```
src/
├── app/        main.tsx · App.tsx · i18n.ts · store.ts · index.css
├── routes/     path.ts (every path constant) · Routes.tsx
├── layout/     admin-layout/ · home-layout/ · navItems.ts
├── features/   one folder per domain — see below
└── shared/     api · auth · components · constants · form-field
                helpers · hooks · lib · pages · table · types · ui
```

Inside a feature: `api/` · `hooks/` · `types/` · `components/` · `pages/` (+ `pages/sections/`) ·
`helpers/` · `model/` · `validations/` · `index.ts`

---

## The rules that bite

**Every folder has an `index.ts`. Every import is `@/` and addresses a folder.**

```ts
// ✅ address the folder
import { useProductDetailQuery, ProductListHeader } from "@/features/product";
import { DataTable, TableActions } from "@/shared/table";
import { confirmDelete, formatMoney, dateFormat } from "@/shared/helpers";
import { productApi } from "@/features/product/api";

// ❌ reaching past a folder's index.ts
import DataTable from "@/shared/table/DataTable";
import { formatMoney } from "@/shared/helpers/formatters";

// ❌ relative
import { productApi } from "../api/productApi";
```

- **One import line per folder** — four symbols from `@/shared/helpers` is one statement.
- **`shared/` must never import `@/features/...`.** If it needs a domain, it is not shared.
- **A parent barrel never re-exports child barrels.** `src/`, `src/shared/`, `src/features/`,
  `src/layout/` have no `index.ts` — a mega-barrel destroys chunking.
- **A file never imports its own folder's barrel** — that is a cycle. Address the sibling
  directly.
- **`Routes.tsx` lazy targets the page file**, not `pages/` — through the barrel the chunk
  would contain every page in the feature.
- **The cost:** barrels hide dead code. The dead-export pass is mandatory before a release.

---

## Patterns

### Imports — always `@/`, always a folder

```ts
import { useProductListQuery } from "@/features/product";     // ✅
import { formatMoney, dateFormat } from "@/shared/helpers";   // ✅ one line per folder
import { formatMoney } from "@/shared/helpers/formatters";    // ❌ past the index.ts
import { useProductListQuery } from "../../features/product"; // ❌ relative
```

### Reuse — the two-strike rule

**The second time something is needed, it is extracted — not copied.** Two, not three.
Replace **every** occurrence; leaving the original means two implementations plus a shared
one. Reusable means: data through props, no domain types, fetches nothing, varies by prop —
never by `if (page === "product")`.

| Repeated in                       | Goes to                    |
| --------------------------------- | -------------------------- |
| two places in one feature         | `features/<d>/components/` |
| two features, no domain knowledge | `shared/components/`       |
| presentational only               | `shared/ui/`               |
| pure function                     | `shared/helpers/`          |
| stateful logic, no JSX            | `shared/hooks/`            |

### Formatting — never in a component

If you are about to write `.toFixed()`, `.replace(/\D/g, "")`, `.slice()`,
`toLocaleDateString()`, `Intl.NumberFormat` or `dayjs().format()` inside a component, an
input handler or a table column — **stop**. It belongs in `@/shared/helpers`.

```ts
import { formatMoney, formatMoneyInput, parseMoneyInput,
         formatPhoneNumber, formatTIN, formatFileSize, formatPercent,
         truncate, normalizeText,
         dateFormat, fullDateFormat, localizedDateFormat, toApiDate,
         getNameByLanguage } from "@/shared/helpers";
```

Every helper tolerates `null`/`undefined` and returns `"—"` — call sites MUST NOT add a
display ternary. Requests carry parsed values (`parseMoneyInput`, `toApiDate`), never the
display string.

### Routes — always `paths.*`

```ts
navigate(paths.PRODUCT_DETAIL.replace(":id", String(id)));  // ✅
navigate(`/product/${id}`);                                  // ❌
```

### Language — always `useCurrentLanguage()`

```ts
const lang = useCurrentLanguage();                                    // ✅
const lang = (i18n.language?.slice(0, 2) || "uz") as Language;        // ❌
```

### API layer

```ts
const urls = { getList: "/entity/list", getDetail: (id: number) => `/entity/detail/${id}` };

export const entityApi = {
  getList: (params?: EntityListParams) =>
    baseApiClient.get<EntityListResponse, EntityListParams, undefined>(urls.getList, params),
  getDetail: (id: number) =>
    baseApiClient.get<EntityDetail, undefined, undefined>(urls.getDetail(id)),
};
```

### Hook layer

```ts
export const useEntityListQuery = (params: EntityListParams) =>
  useQuery({
    queryKey: ["entity", "list", params],
    queryFn: () => entityApi.getList(params).then((r) => r.data),
  });

export const useEntityCreateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateEntityRequest) => entityApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["entity", "list"] }),
  });
};
```

### List page — `DataTable` + column helpers

```tsx
const columns = [
  {
    title: <TableHeaderText text={t("common.labels.name")} />,
    render: (_: unknown, r: Row) => <TableText text={r.name} onClick={() => view(r)} />,
  },
  {
    title: <TableHeaderText text={t("common.labels.actions")} />,
    key: "actions",
    render: (_: unknown, r: Row) => (
      <TableActions onView={() => view(r)} onEdit={() => edit(r)} onDelete={() => del(r)} />
    ),
  },
];

<DataTable
  data={data} columns={columns} isLoading={isLoading} isError={isError}
  pagination={pagination} setPage={setPage} setPageSize={setPageSize}
  emptyTitle={t("pages.x.no-data")} emptyDescription={t("pages.x.no-data-description")}
/>
```

---

## Shared kit — never bypass

| Need                                   | Import from           |
| -------------------------------------- | --------------------- |
| List table + column helpers            | `@/shared/table`      |
| Pagination footer · empty state        | `@/shared/ui`         |
| Pagination state · react-query         | `@/shared/hooks`      |
| Delete confirm — never `Modal.confirm` | `@/shared/helpers`    |
| All formatting (money/date/phone/…)    | `@/shared/helpers`    |
| Localized value                        | `@/shared/helpers`    |
| Primary button — never antd `Button`   | `@/shared/components` |
| Loading / error / empty wrapper        | `@/shared/components` |
| Form footer · trilingual inputs        | `@/shared/components` |
| Current language                       | `@/shared/constants`  |
| Class merging — `cn()`                 | `@/shared/lib`        |
| Role guard                             | `@/shared/auth`       |

---

## Naming

| Layer                      | File                              | Exported symbol                          |
| -------------------------- | --------------------------------- | ---------------------------------------- |
| `features/<d>/api/`        | `<domain>Api.ts`                  | `<domain>Api`                            |
| `features/<d>/hooks/`      | `use<Domain>Query.ts`             | `use<Domain><Action>Query` / `…Mutation` |
| `features/<d>/types/`      | `<shape>.ts` camelCase            | `PascalCase` interfaces                  |
| `features/<d>/model/`      | `<domain>Slice.ts`                | `<domain>Slice`                          |
| `features/<d>/components/` | `PascalCase.tsx`                  | matches the filename                     |
| `features/<d>/pages/`      | `<Domain><Role?>Page.tsx`         | matches the filename                     |
| `shared/**`                | `PascalCase.tsx` / `camelCase.ts` | matches the filename                     |

- Every data hook ends in **`Query`** or **`Mutation`**. Never `Mutate`, never a bare `useNews`.
- `types/` files carry **no** `Type` suffix.
- A component filename must equal its exported name.
- **Two components must never share a name** anywhere in `src/`.

---

## Anti-patterns

**Imports**

- **Never** write a relative import across folders — always `@/`
- **Never** import a file that sits next to an `index.ts` — address the folder
- **Never** import `@/features/x/<anything>` from outside feature `x`
- **Never** import `@/features/…` from `shared/`
- **Never** re-export a child barrel from a parent barrel
- **Never** let a file import its own folder's `index.ts`

**Reuse**

- **Never** copy-paste markup or logic — the second occurrence is an extraction
- **Never** leave the original in place after extracting
- **Never** put a domain type in a `shared/` component's props
- **Never** let a reusable component fetch its own data
- **Never** branch a shared component on its caller — that is a prop
- **Never** move to `shared/` for reuse that has not happened yet

**Formatting**

- **Never** format inside a component, an input handler, or a table column
- **Never** define `getLocalizedValue`, `formatMoneyInput` or `currentLanguage` locally
- **Never** add a display ternary for `null` — the helper returns `"—"` already
- **Never** send a formatted display string in a request body

**Structure**

- **Never** put a routed page anywhere but `features/<d>/pages/`
- **Never** name a sub-folder of `pages/` anything but `sections/`
- **Never** name a hook `use<Thing>Mutate`
- **Never** add a `Type` suffix to a file under `types/`
- **Never** let two components share a name anywhere in `src/`
- **Never** store server data in Redux

**Practice**

- **Never** hardcode a URL path, a hex colour, or a UI string
- **Never** hand-roll a list table, a pagination footer, or `Modal.confirm`
- **Never** write `handleSetPage = useCallback((p) => setPage(p), [setPage])` — pass `setPage`
  (a wrapper with real conditional logic is fine)
- **Never** use `clsx()` where a caller's `className` must win — use `cn()`
- **Never** commit `.env`
- **Never** silence a linter to land a violation — fix the design

---

## Traps that cost real debugging time

- **HTTP 200 is not success.** Some endpoints answer a failure with status 200 and the error
  in the body. axios resolves and the interceptor never runs — the api/ module must detect
  and reject.
- **`clsx` ≠ `cn`.** `clsx` concatenates; conflicting Tailwind classes are then resolved by
  CSS source order, not argument order. Callers think they are overriding and are not.
- **antd overlay triggers need `forwardRef`.** `Dropdown` / `Tooltip` / `Popconfirm` attach a
  ref to the trigger child; a plain function component fails silently.
- **`children` in `...restProps` is dropped.** Explicit JSX children always win.
- **`<Button danger>` is outlined; `<Button type="primary" danger>` is filled.** Not one style.
- **Timer effects must not depend on their own tick** — depend on the boolean that starts
  and stops them.

---

## Commands

```bash
npm run dev         # Vite dev server
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # production build
node scripts/audit.mjs   # 12 architecture checks — exits 1 on any violation
```

**The verification gate — all four, every task, before saying it is done:**

```bash
npm run typecheck && npm run lint && node scripts/audit.mjs && npm run build
```

`scripts/audit.mjs` enforces: cross-feature reach, `shared/`→`features/`, duplicate
component names, missing barrels, imports past a barrel, relative imports, broken
references, formatting inside components, hook naming, `Type`-suffixed type files,
hardcoded routes, and self-barrel cycles. **Do not edit it to make a task pass.**

---

## Task recipes

### Add a CRUD feature

```
cp -r src/features/_template src/features/<domain>
rename template/Template → <domain>/<Domain> in every file
types/<domain>.ts       wire shapes, no Type suffix
api/<domain>Api.ts      urls object + CRUD, the only baseApiClient consumer
hooks/use<Domain>Query.ts   Query/Mutation hooks, invalidation wired
validations/create<Domain>.ts   Zod schema, if there are forms
pages/<Domain>Page.tsx  list screen via DataTable
index.ts in every folder you touched
routes/path.ts          path constants
routes/Routes.tsx       lazy() under the right layout
layout/navItems.ts      sidebar entry + role filter
public/locales/*        every key, every language
→ verification gate
```

### Add a page to an existing feature

```
pages/<Domain><Screen>Page.tsx  →  pages/index.ts  →  routes/path.ts  →  routes/Routes.tsx
→ locales  →  verification gate
```

### Add a field to an existing form

```
types/       add to the request/response interface
validations/ add to the Zod schema
the form section component (NOT the page)
locales      label + validation message, every language
→ verification gate
```

### Extract a repeated piece

```
1. Confirm it exists in ≥2 places:  grep -rn "<marker>" src
2. Decide the home (see the reuse table above)
3. Write it once, props-driven, no domain types, fetches nothing
4. Replace EVERY occurrence — deleting each original
5. Export it from the folder's index.ts
→ verification gate
```

### Debug "it does not work"

```
1. Reproduce, and say exactly what you observed
2. Check the layer boundary first — most bugs are a rule violation:
     data not refreshing  → a mutation that invalidates nothing
     stale/duplicated UI  → server data copied into Redux
     className ignored    → clsx() instead of cn()
     dropdown dead        → shared component missing forwardRef
     silent API failure   → HTTP 200 with an error body
     wrong language       → i18n.language read directly
3. Fix the cause, not the symptom
→ verification gate
```

---

## Environment

Config lives in `.env` (git-ignored — never commit; do **not** quote values).
Every variable is declared in `.env.example` and read only in `shared/constants/envURI.ts`.

---

## i18n

- `public/locales/{uz,ru,en}/translation.json`; `uz` is the default.
- All three languages stay key-complete — a missing key renders the raw key to the user.
- Every user-visible string goes through `t()`.
- A key name must survive a wording change; if the meaning changes, rename the key.
