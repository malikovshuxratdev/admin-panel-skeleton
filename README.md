# Admin Panel — Project Structure Documentation

A reusable architecture for **any** multi-role admin panel on React + Vite + TypeScript.
Copy this tree into a new project and the structure, the rules and the audit come with it.

It is written to be read by two audiences, and the second one is the reason it is this
precise: a developer, and an **AI coding agent implementing tasks against it**. Where a
rule could be read two ways, it is stated as an obligation or a prohibition with a
mechanical check behind it, so "did we follow the architecture?" has an answer that is run,
not argued.

- `README.md` — this file. The full reference.
- `ARCHITECTURE.md` — *why* the rules exist. The authority when documents disagree.
- `CLAUDE.md` — the agent's operating contract: workflow, recipes, verification gate.
- `scripts/audit.mjs` — 12 checks. The enforcement.

Terminology used throughout:

| Word           | Meaning                                                            |
| -------------- | ------------------------------------------------------------------ |
| **MUST**       | Obligation. Code that violates it is wrong and must not be merged. |
| **MUST NOT**   | Prohibition. Same weight, stated negatively.                       |
| **SHOULD**     | Strong default. Deviating requires a reason stated in review.      |
| **MAY**        | Genuinely optional.                                                |

---

## 0. What ships in this skeleton

This is a **structure + rulebook**, not a runnable app. There is no `package.json`,
`vite.config.ts` or `tsconfig.json` — add those from your own starter, then copy this tree
over it.

**Real, working files** (copy and use as-is):

```
src/shared/lib/utils.ts                 cn() — clsx + tailwind-merge
src/shared/api/baseClient.ts            the axios singleton
src/shared/hooks/useQuery.ts            the single react-query entry point
src/shared/hooks/usePaginatedParams.ts  pagination + filter state
src/shared/helpers/formatters.ts        money · phone · TIN · size · percent · text
src/shared/helpers/dateFormats.ts       every date format in the app
src/shared/helpers/convertName.ts       getNameByLanguage
src/shared/helpers/confirmDelete.tsx    the one delete dialog
src/shared/constants/language.ts        useCurrentLanguage
src/shared/constants/envURI.ts          the only import.meta.env reader
src/shared/table/DataTable.tsx          + TableHeaderText / TableText / TableActions
src/shared/ui/TableFooter.tsx           + EmptyState
src/layout/admin-layout/AdminLayout.tsx
src/routes/path.ts · Routes.tsx
index.ts in every module folder      absolute @/ paths
scripts/audit.mjs                    12 architecture checks, no dependencies
```

**The feature template** — `src/features/_template/`. Copy the folder, rename every
`template` / `Template` to your domain, delete what you do not need. Every file carries a
header comment stating that layer's rules.

**Empty folders** carry a `.gitkeep` whose single line says what belongs there.

**Section 2 documents the target structure**, including files this skeleton does not ship
(`app/main.tsx`, `app/store.ts`, `layout/navItems.ts`). Those are yours to write; the rules
governing them are in §3.

`node scripts/audit.mjs` passes on this skeleton as shipped, and every check has been
verified to actually catch its violation. Keep it green.

**Nothing here is domain-specific.** Examples use `product` and `order` as stand-in
domains; the role names, languages and env variables are placeholders to replace.

---

## 1. Overview

The project is built **feature-first**. Every domain owns its own API client, hooks, types,
components and pages. A feature's internals are unreachable from outside; the only public
surface is its root `index.ts`.

**Every folder that holds modules has an `index.ts`, and every import addresses a folder
via `@/`** — never a file inside it. See §3.10 for the rule, its two carve-outs, and the
cost it carries.

**Dependency rule (the one that matters):**

> `app/ -> routes/ -> layout/ -> features/ <-> shared/`
>
> `shared/` **never** imports `features/`. A feature **never** reaches past another
> feature's `index.ts`.

This is not decoration. The alternative — grouping by technical type (`components/`,
`hooks/`, `services/`) — fails predictably at scale: every folder becomes a dumping ground,
"is this used anywhere?" stops having an answer, and deleting a feature means hunting its
pieces across nine directories.

Feature-first fixes that **structurally** rather than by discipline. When a domain's every
file lives under `features/<domain>/`, deleting the domain is `rm -rf` plus one route entry,
and its public surface is a single file you can read in ten seconds.

**Stack**

| Tool                  | Version | Note                                                        |
| --------------------- | ------- | ----------------------------------------------------------- |
| React                 | 18      | SPA, no SSR                                                 |
| Vite                  | 7       | `import.meta.env.VITE_*` for env vars                       |
| TypeScript            | 5       | `strict` — non-negotiable                                   |
| Tailwind CSS          | 3       | utility-first; no CSS modules, no styled-components         |
| Ant Design            | 5       | Table, Form, Modal, Drawer, notification                    |
| @tanstack/react-query | 5       | **all** server state                                        |
| react-hook-form       | 7       | forms, with Zod via `@hookform/resolvers`                   |
| zod                   | 4       | schema validation                                           |
| react-router-dom      | 7       | `createBrowserRouter`                                       |
| axios                 | latest  | one singleton client                                        |
| react-redux           | 9       | UI/form state **only** — never server state                 |
| react-i18next         | 16      | uz (default) / ru / en                                      |
| dayjs                 | latest  | date formatting — preferred over `moment`                   |

---

## 2. Full Directory Tree

```
.
├── public/
│   └── locales/                        # i18n resources, one folder per language
│       ├── uz/translation.json         # default language
│       ├── ru/translation.json
│       └── en/translation.json
│
├── src/
│   ├── app/                            # Composition root — runs once at startup
│   │   ├── main.tsx                    # ReactDOM.createRoot
│   │   ├── App.tsx                     # providers: ConfigProvider, QueryClient, Redux, Auth
│   │   ├── i18n.ts                     # react-i18next configuration
│   │   ├── store.ts                    # Redux store; slices registered here
│   │   └── index.css                   # @tailwind base/components/utilities
│   │
│   ├── routes/                         # Routing table
│   │   ├── path.ts                     # EVERY path constant, one object
│   │   ├── Routes.tsx                  # createBrowserRouter + lazy() route targets
│   │   └── index.ts                    # barrel
│   │
│   ├── layout/                         # Persistent shells and role guards
│   │   ├── admin-layout/
│   │   │   ├── AdminLayout.tsx         # outer shell: sidebar + navbar + <Outlet/>
│   │   │   └── shared/                 # Sidebar, Navbar, Profile — layout-only pieces
│   │   ├── home-layout/                # public (unauthenticated) shell
│   │   └── navItems.ts                 # sidebar entries, filtered by role
│   │
│   ├── features/                       # One folder per business domain
│   │   └── _template/                  # ← copy this folder to start a feature
│   │       ├── api/                    # HTTP calls, the only baseApiClient consumer
│   │       │   ├── templateApi.ts
│   │       │   └── index.ts
│   │       ├── hooks/                  # react-query wrappers
│   │       │   ├── useTemplateQuery.ts
│   │       │   └── index.ts
│   │       ├── types/                  # request/response shapes
│   │       │   ├── template.ts
│   │       │   └── index.ts
│   │       ├── components/             # reusable pieces for THIS feature (+ index.ts)
│   │       ├── pages/
│   │       │   ├── TemplatePage.tsx    # routed page
│   │       │   ├── sections/           # page-sized chunks (the only sub-folder allowed)
│   │       │   └── index.ts
│   │       ├── helpers/                # pure domain functions (+ index.ts)
│   │       ├── model/                  # Redux slice (UI/form state) (+ index.ts)
│   │       ├── validations/            # Zod schemas (+ index.ts)
│   │       └── index.ts                # THE PUBLIC CONTRACT — what other features may use
│   │
│   └── shared/                         # Domain-agnostic kit. Knows nothing about features.
│       │                               # (no index.ts here — a mega-barrel breaks chunking)
│       ├── api/                        # the single axios instance (+ index.ts)
│       ├── auth/                       # token storage, role context, RoleGuard
│       ├── components/                 # MainButton, DataStateHandler, PageFormActions…
│       ├── constants/                  # language.ts, envURI.ts, roles.ts
│       ├── form-field/                 # react-hook-form–bound inputs
│       ├── helpers/                    # formatters · dateFormats · convertName · confirmDelete
│       ├── hooks/                      # useQuery re-export, usePaginatedParams
│       ├── lib/utils.ts                # cn() = clsx + tailwind-merge
│       ├── pages/                      # NotFoundPage, ForbiddenPage
│       ├── table/                      # DataTable, TableHeaderText, TableText, TableActions
│       ├── types/                      # cross-cutting TS types
│       └── ui/                         # Pagination, TableFooter, EmptyState, Spinner…
│
├── .env.example                        # every VITE_* variable, documented
├── .gitignore
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Layer-by-layer Breakdown

### 3.1 `src/app/` — Composition Root

**Responsibility:** Start the application once. Mount providers. Nothing else.

**MUST NOT contain:** business logic, API calls, route definitions, domain components.

**Allowed imports:** anything. This is the top of the graph — everything may be imported
here, and nothing may import `app/`.

**Conventions**

- `App.tsx` holds providers only; if it grows a `useEffect` that fetches domain data, that
  logic belongs in a feature.
- Redux slices are registered in `store.ts`, but each slice is **defined** in its feature's
  `model/` folder.

---

### 3.2 `src/routes/` — Routing

**Responsibility:** Map URLs to pages, and nothing more.

**MUST**

- Declare every path in `path.ts` as a constant.
- Reference paths as `paths.X` everywhere in the codebase.
- Use `lazy(() => import("@/features/x/pages/XPage"))` for route targets.

**MUST NOT**

- Write a literal path anywhere outside `path.ts` —
  `navigate("/product/" + id)` is forbidden; use
  `navigate(paths.PRODUCT_DETAIL.replace(":id", String(id)))`.
- Deep-import anything other than a feature's `pages/` module.
- Put role checks on individual routes — group them under a guarded layout instead.

**The documented exception.** `Routes.tsx` is the **only** file permitted to import past a
feature's `index.ts`:

```ts
const TemplatePage = lazy(() => import("@/features/_template/pages/TemplatePage"));
```

Going through `@/features/_template` here would place that feature's entire public surface
— every hook, type and component the barrel re-exports — inside the lazy chunk, defeating
code splitting for every route at once.

---

### 3.3 `src/layout/` — Shells and Role Guards

**Responsibility:** The persistent frame around routed pages, and the role gate.

**MUST**

- Express role restrictions here, once per shell, not per route.
- Keep layout-only pieces (Sidebar, Navbar, Profile) in the layout's own `shared/` folder.

**MUST NOT**

- Fetch domain data. A layout may read the current user and permissions; it MUST NOT load
  a product, an order, or any other domain entity.

**Typical guard matrix**

| Layout                 | Accessible by                                    |
| ---------------------- | ------------------------------------------------ |
| `AdminLayout`          | all authenticated roles (outer shell)            |
| `AdminOnlyLayout`      | `RoleAdmin` only                                 |
| `<Scoped>Layout`       | `RoleAdmin` + one scoped role                    |
| `<Operator>Layout`     | two operator roles (+ Admin override)            |

---

### 3.4 `features/<domain>/api/` — HTTP Layer

**Responsibility:** Turn a domain operation into an HTTP call.

**MUST**

- Be the **only** layer that imports `baseApiClient`.
- Keep every URL in a local `urls` object at the top of the file.
- Be named `<domain>Api.ts` and export `<domain>Api`.

**MUST NOT**

- Import React, hooks, components, or react-query.
- Unwrap `.data` — that is the hook layer's job.
- Contain `if` branches on business state. Transport only.

**Allowed imports:** `@/shared/api/baseClient`, this feature's `types/`, stdlib.

**Template**

```ts
import { baseApiClient } from "@/shared/api/baseClient";

const urls = {
  getList: "/entity/list",
  getDetail: (id: number) => `/entity/detail/${id}`,
  create: "/entity/create",
  update: (id: number) => `/entity/update/${id}`,
  delete: (id: number) => `/entity/delete/${id}`,
};

export const entityApi = {
  getList: (params?: EntityListParams) =>
    baseApiClient.get<EntityListResponse, EntityListParams, undefined>(urls.getList, params),
  getDetail: (id: number) =>
    baseApiClient.get<EntityDetail, undefined, undefined>(urls.getDetail(id)),
  create: (body: CreateEntityRequest) =>
    baseApiClient.post<EntityDetail, CreateEntityRequest>(urls.create, body),
  update: (id: number, body: UpdateEntityRequest) =>
    baseApiClient.put<EntityDetail, UpdateEntityRequest>(urls.update(id), body),
  delete: (id: number) => baseApiClient.delete<void, undefined>(urls.delete(id)),
};
```

> **Trap — HTTP 200 with an error body.** Some backends answer a failed operation with
> status 200 and the failure inside the body (`{ code: 4111, _code: "INVALID_CODE" }`).
> axios resolves, the response interceptor never runs, and the caller's `onSuccess` fires
> with no data. The api/ module **MUST** detect that shape and reject explicitly:
>
> ```ts
> login = async (body: LoginBody) => {
>   const res = await this.api.post<LoginResponse | ApiErrorBody>(urls.login, body);
>   if ((res.data as ApiErrorBody)._code) throw new ApiBodyError(res.data as ApiErrorBody);
>   return res.data as LoginResponse;
> };
> ```

---

### 3.5 `features/<domain>/hooks/` — Server State

**Responsibility:** Wrap the api layer in react-query and expose it to components.

**MUST**

- Name every data hook with a `Query` or `Mutation` suffix.
- Unwrap `.data` here, so components never see the axios envelope.
- Invalidate the affected query keys in every mutation's `onSuccess`.
- Be named `use<Domain>Query.ts`.

**MUST NOT**

- Use the suffix `Mutate`, or export a bare `useEntity`.
- Store server data in Redux.
- Render anything.

**Non-data hooks** (`useDrawerGuard`, `usePaginatedParams`) are exempt from the suffix rule.

**Splitting.** One hooks file per domain is the default. When it passes ~400 lines or covers
clearly unrelated concerns, split by concern — `useOrderPaymentQuery.ts`,
`useOrderShipmentQuery.ts` — and update the barrel. A 28-hook, 800-line file covering
four concerns is a maintenance liability, not a convention.

**Template**

```ts
export const useEntityListQuery = (params: EntityListParams) =>
  useQuery({
    queryKey: ["entity", "list", params],
    queryFn: () => entityApi.getList(params).then((r) => r.data),
  });

export const useEntityDetailQuery = (id: number | undefined) =>
  useQuery({
    queryKey: ["entity", "detail", id],
    queryFn: () => entityApi.getDetail(id!).then((r) => r.data),
    enabled: !!id,
  });

export const useEntityCreateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateEntityRequest) => entityApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["entity", "list"] }),
  });
};
```

---

### 3.6 `features/<domain>/types/` — Wire Shapes

**Responsibility:** Describe what the server sends and accepts.

**MUST**

- Use PascalCase for interfaces.
- Name files in camelCase **without** a `Type` suffix — the folder already says it.
  `productDetail.ts`, never `productDetailType.ts`.

**MUST NOT**

- Contain functions, constants with logic, or React types.

---

### 3.7 `features/<domain>/components/` — Feature Components

**Responsibility:** Reusable UI belonging to this domain.

**MUST**

- Use PascalCase filenames matching the exported component name exactly.
- Move to `shared/` the moment a second feature needs the component — **and** strip its
  domain knowledge on the way. If it cannot be stripped, it is not shared.

**MUST NOT**

- Share a component name with any other component anywhere in `src/`. Two files named
  `AuthorHeader.tsx` mask each other in every name-based audit. Qualify by domain:
  `OrderStatusField` / `ProductStatusField`.

---

### 3.8 `features/<domain>/pages/` — Routed Pages

**Responsibility:** Compose hooks and sections into a screen.

**MUST**

- Be named `<Domain><Role?>Page.tsx` if `Routes.tsx` renders it.
- Use `DataTable` for any list screen.
- Use `PageFormActions` for form footers.

**MUST NOT**

- Contain a hand-rolled `<table>`, a hand-rolled pagination footer, or a raw
  `Modal.confirm`.
- Grow past ~200 lines. Extract into `pages/sections/`.

**`sections/` is the only sub-folder name allowed inside `pages/`.** Not `parts/`, not
`blocks/`, not `fragments/`. Sections are page-sized chunks of one screen; they are not
reusable and MUST NOT be imported by another feature.

---

### 3.9 `features/<domain>/model/` — Redux Slice

**Responsibility:** UI and multi-step form state that must survive across components.

**MUST**

- Be named `<domain>Slice.ts` and export `<domain>Slice`.
- Be registered in `app/store.ts`.

**MUST NOT**

- Hold server data. Server data lives in react-query, always. A slice that caches a list
  fetched from the API is a bug — it will go stale and disagree with the cache.

---

### 3.10 `index.ts` — Every Folder Has One

**THE RULE: every folder that contains modules has an `index.ts`, and every import
addresses a folder, never a file inside it.**

```ts
// ✅ address the folder
import { DataTable, TableHeaderText, TableActions } from "@/shared/table";
import { formatMoney, formatPhoneNumber } from "@/shared/helpers";
import { useTemplateListQuery } from "@/features/_template/hooks";

// ❌ reaching past a folder's index.ts
import DataTable from "@/shared/table/DataTable";
import { formatMoney } from "@/shared/helpers/formatters";
```

**MUST**

- Exist in every folder holding `.ts` / `.tsx` modules.
- Use absolute `@/` paths inside the barrel too — never `./X`.
- Re-export the folder's own direct modules only.
- Point at real modules. Never a shim file whose only content is one re-export.

**MUST NOT**

- Re-export a child folder's barrel. `@/shared/index.ts` re-exporting `table`, `ui`,
  `helpers` and the rest would make one import pull the entire kit into every chunk. Each
  folder's barrel covers **its own files**; nesting stops there.
- Be imported by a file inside the same folder. `shared/table/DataTable.tsx` importing
  `@/shared/table` is a circular import — a sibling file is addressed directly
  (`@/shared/table/TableText`) or, better, the shared piece moves up.

**Two carve-outs, both with a technical reason**

1. **Folders containing only other folders get no barrel** — `src/`, `src/shared/`,
   `src/features/`, `src/layout/`. A barrel there is a mega-barrel: it re-exports
   everything transitively and destroys chunking.

2. **`Routes.tsx` lazy targets address the page file, not the `pages` barrel.**

   ```ts
   // ✅ one page per chunk
   const TemplatePage = lazy(() => import("@/features/_template/pages/TemplatePage"));

   // ❌ pulls EVERY page of the feature into the chunk
   const TemplatePage = lazy(() => import("@/features/_template/pages"));
   ```

**The cost you are accepting.** Barrels keep modules *reachable*, so "is this file imported
anywhere?" answers yes for a file nothing actually uses. Dead code stays alive and looks
alive. Because the structure no longer catches it, **the §7 dead-export audit becomes
mandatory, not optional** — run it before every release, and audit *exported names*, not
file paths.

**The feature root `index.ts` is still special.** Every folder has a barrel, but
`features/<domain>/index.ts` is the one that is a **contract**: it defines what other
features may use. Export what neighbours genuinely need; an export there with no
cross-feature consumer is dead weight.

---

### 3.11 `src/shared/` — The Kit

**Responsibility:** Domain-agnostic building blocks.

**MUST NOT import `@/features/...`. Ever.** This is the single hardest rule in the codebase.
If a shared module needs a domain type, a domain hook or a domain constant, it is not
shared — move it into the feature that owns it.

**Every import addresses a folder** (§3.10):

```ts
import { DataTable, TableActions } from "@/shared/table";
import { confirmDelete, formatMoney } from "@/shared/helpers";
```

**The kit, and what it replaces**

| Need                          | Import from            | Never do instead              |
| ----------------------------- | ---------------------- | ----------------------------- |
| List table                    | `@/shared/table`       | hand-rolled `<Table>`         |
| Column header                 | `@/shared/table`       | inline `<span className=…>`   |
| Row actions                   | `@/shared/table`       | rebuilt dropdown              |
| Pagination footer             | `@/shared/ui`          | hardcoded footer JSX          |
| Pagination state              | `@/shared/hooks`       | local `useState` pair         |
| Delete confirmation           | `@/shared/helpers`     | raw `Modal.confirm`           |
| Primary button                | `@/shared/components`  | bare antd `Button`            |
| Loading / error / empty       | `@/shared/components`  | inline ternary ladders        |
| Form footer                   | `@/shared/components`  | ad-hoc button rows            |
| Trilingual inputs             | `@/shared/components`  | three hand-wired inputs       |
| Current language              | `@/shared/constants`   | `i18n.language.slice(0, 2)`   |
| Localized value               | `@/shared/helpers`     | local `getLocalizedValue`     |
| Money / phone / TIN / size    | `@/shared/helpers`     | formatting inside a component |
| Date formatting               | `@/shared/helpers`     | `dayjs().format()` at a call site |
| Class merging                 | `@/shared/lib` → `cn()`| bare `clsx()` on overridables |

> **`cn()`, not `clsx()`, in any component that accepts a `className` prop.** `clsx` only
> concatenates: `px-4` and `px-8` both survive, and which one wins is decided by CSS source
> order, not by argument order. Callers think they are overriding and are not.
> `cn()` = `twMerge(clsx(...))` resolves the conflict deterministically.

---

## 3A. The Reusability Law

### 3A.1 The two-strike rule

> **The moment the same markup, logic or handler exists in TWO places, it becomes a
> reusable module. Not three places. Two.**

Copy-paste is not a shortcut, it is a decision to maintain N copies forever. The second
occurrence is where the cost is still one extraction; by the fourth, the copies have already
drifted and the extraction is a refactor with a bug hunt attached.

**The procedure, every time:**

```
1. You are about to copy something. Stop.
2. Does the piece carry domain knowledge (domain types in props, a domain hook inside)?
     yes → it belongs to that feature   → features/<d>/components/
     no  → it is kit                    → shared/components/ (or shared/ui/, shared/helpers/)
3. Extract it. Give it a name that says what it IS, not where it first appeared.
4. Replace BOTH occurrences. Leaving the original is how you get two implementations.
5. Export it from the folder's index.ts.
```

**Rule 4 is the one people skip.** An extraction that does not delete the original has
made things worse: now there are two implementations *and* a shared one.

### 3A.2 What "reusable" actually requires

A component is reusable only if all four hold. If any fails, it is not reusable — it is a
copy with a shared name.

| Requirement          | Meaning                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| **No domain types**  | Props are primitives and generic shapes, not `ProductDetail`.            |
| **No self-fetching** | It receives data through props. A component that calls its own query hook is bound to one screen. |
| **Configurable**     | Variation comes through props, not through `if (page === "product")`.    |
| **No hidden state**  | It does not read Redux or context that only one screen provides.         |

```tsx
// ❌ not reusable — knows a domain, fetches its own data, branches on the caller
const Header = ({ productId, mode }) => {
  const { data } = useProductDetailQuery(productId);
  return <h1>{mode === "order" ? data?.orderNumber : data?.name}</h1>;
};

// ✅ reusable — receives what it renders, varies by prop
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => ( /* … */ );
```

### 3A.3 Where an extraction goes

| Repeated in                        | Goes to                    |
| ---------------------------------- | -------------------------- |
| two places in one feature          | `features/<d>/components/` |
| two features, no domain knowledge  | `shared/components/`       |
| two features, presentational only  | `shared/ui/`               |
| pure function, no JSX              | `shared/helpers/`          |
| stateful logic, no JSX             | `shared/hooks/`            |

**MUST NOT** move something to `shared/` just because it *might* be reused later.
Anticipated reuse is not reuse. Move it on the day the second consumer appears.

### 3A.4 Signals that an extraction is overdue

- The same `<div className="flex items-center justify-between …">` header in three pages.
- The same table column definition (status tag, date cell, actions) in several tables.
- The same `onChange` masking logic in more than one input.
- The same modal shell (title, footer buttons, loading state) around different bodies.
- The same `if (isLoading) … if (isError) … if (!data) …` ladder — that is
  `DataStateHandler`, already written.

---

## 3B. Formatting and Helpers

### 3B.1 The rule

> **A component MUST NOT format a value. An input MUST NOT format a value. All formatting
> lives in `@/shared/helpers` and is called by name.**

If you are about to write any of these inside a component, an input handler, or a table
column — stop, it belongs in `shared/helpers/`:

```
.toFixed(…)          .replace(/\D/g, "")      .padStart(…)
.slice(0, 2)         .toLocaleDateString(…)   .toLocaleString(…)
Intl.NumberFormat    dayjs(x).format(…)       manual "1 234 567" spacing
`${(n * 100).toFixed(2)}%`                    inline null/undefined ternaries for display
```

**Why this is a hard rule, not a preference.** The same money value renders in a table cell,
a detail card, a form field and an export. Written at each call site, those four drift apart
within weeks — different rounding, different thousands separator, different empty
placeholder. When a rounding bug is reported, nobody can find every copy. One named function
means one fix.

### 3B.2 The catalogue

Everything below is already written in `@/shared/helpers`:

| Function                     | Input → output                            |
| ---------------------------- | ------------------------------------------ |
| `formatMoney`                | `1234567.5` → `"1 234 567,50"`             |
| `formatMoneyInput`           | live masking: `"1234567"` → `"1 234 567"`  |
| `parseMoneyInput`            | `"1 234 567,50"` → `1234567.5` for the body |
| `formatPhoneNumber`          | `"998901234567"` → `"+998 (90) 123-45-67"` |
| `formatTIN`                  | `"123456789"` → `"123 456 789"`            |
| `formatFileSize`             | `1536` → `"1.5 KB"`                        |
| `formatPercent`              | `0.4213` → `"42.13%"`                      |
| `truncate`                   | long text → `"Lorem ipsum…"`               |
| `normalizeText`              | `"  a   b "` → `"a b"`, empty → `undefined` |
| `dateFormat`                 | → `"03.08.2026"`                           |
| `fullDateFormat`             | → `"03.08.2026 15:22"`                     |
| `timeFormat`                 | → `"15:22"`                                |
| `localizedDateFormat`        | → `"3 avgust 2026"` / `"3 августа 2026"`   |
| `toApiDate`                  | display value → `"YYYY-MM-DD"` for requests |
| `getNameByLanguage`          | trilingual object → the right string        |

**Every one of them tolerates `null` / `undefined`** and returns the em-dash placeholder.
Call sites therefore never need a ternary — and MUST NOT add one.

### 3B.3 Inputs

An input's job is to capture a value, not to decide how it looks.

```tsx
// ❌ masking written inside the component
<Input onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "")
        .replace(/\B(?=(\d{3})+(?!\d))/g, " "))} />

// ✅ named helper, one implementation
import { formatMoneyInput } from "@/shared/helpers";
<Input onChange={(e) => field.onChange(formatMoneyInput(e.target.value))} />
```

**Display vs transport.** The masked string is for the human; the request body gets the
parsed value. Convert at the boundary, never send the display string:

```ts
const body = { amount: parseMoneyInput(values.amount), date: toApiDate(values.date) };
```

### 3B.4 Adding a helper

**MUST**

- Be a pure function — no React, no hooks, no API calls, no `Date.now()` branching.
- Tolerate `null` / `undefined` and return a sensible placeholder.
- Be named for what it produces (`formatFileSize`), not where it was needed
  (`formatProductCardSize`).
- Be exported from `@/shared/helpers`.

**MUST NOT**

- Live in a feature if two features need it.
- Be duplicated locally "because importing felt heavy".
- Take a component or JSX as an argument. That is a component, not a helper.

---

## 4. Import / Dependency Flow

### 4.1 Layer diagram

```
              ┌─────────┐
              │  app/   │   providers, store, i18n — imported by nothing
              └────┬────┘
                   │
              ┌────▼────┐
              │ routes/ │   path.ts + Routes.tsx
              └────┬────┘
                   │  (lazy) ─────────── the ONE documented deep-import exception
              ┌────▼────┐
              │ layout/ │   shells + role guards
              └────┬────┘
                   │
        ┌──────────▼──────────┐          ┌──────────┐
        │     features/       │ ───────► │ shared/  │
        │  (via index.ts)     │          │          │
        └──────────┬──────────┘          └────┬─────┘
                   │                          │
                   └──────── ✗ ───────────────┘
                     shared MUST NOT import features
```

Cross-feature traffic goes through the contract, never past it:

```ts
// ✅ across features
import { useProductDetailQuery, ProductListHeader } from "@/features/product";

// ❌ reaching past the contract — forbidden
import ProductListHeader from "@/features/product/pages/sections/ProductListHeader";

// ✅ inside the same feature — name the module
import { productApi } from "@/features/product/api/productApi";

// ✅ shared kit — address the folder
import { DataTable, TableActions } from "@/shared/table";
```

### 4.2 Request lifecycle

```
Page component
   │  calls
   ▼
use<Domain>Query()                 features/<d>/hooks/
   │  queryFn
   ▼
<domain>Api.getList(params)        features/<d>/api/
   │
   ▼
baseApiClient.get(url, params)     shared/api/baseClient.ts
   │  request interceptor: attach Bearer token
   ▼
HTTP  ───────────────────────────► backend
   │  response interceptor:
   │    401 → refresh once → retry, else clear tokens + redirect to LOGIN
   │    5xx / network → normalise into HTTPError
   ▼
react-query cache (keyed by queryKey)
   │
   ▼
Page component re-renders with data / isLoading / isError
```

### 4.3 Mutation lifecycle

```
User action → use<Domain>CreateMutation().mutate(body)
   │
   ▼
<domain>Api.create(body) → baseApiClient.post
   │
   ├── onSuccess → queryClient.invalidateQueries({ queryKey: ["domain", "list"] })
   │                 └── affected queries refetch; UI updates itself
   │
   └── onError   → surface a translated message; never a raw server string
```

### 4.4 Auth and role lifecycle

```
LOGIN → token stored (TokenService) → ROLE_SELECT
   │                                      │
   │                                      ▼  user picks one of their roles
   │                               SelectedRoleContext
   │                                      │
   ▼                                      ▼
AdminLayout ── reads selected role ──► navItems filtered
   │
   └── nested guarded layout (AdminOnlyLayout, …) rejects wrong role → ForbiddenPage
```

Two distinct checks, do not confuse them:

```ts
isAdmin(user.roles)              // capability: does this user have the role at all?
isAdminBySelectedRole(selected)  // context: is the user acting as that role right now?
```

Layout guards use the **selected** role. Feature-level capability checks use the roles array.

---

## 5. Cross-cutting Conventions

### 5.1 Imports

Always absolute, always `@/`, always a **folder**:

```ts
// ✅
import { useProductListQuery } from "@/features/product";
import { confirmDelete, formatMoney } from "@/shared/helpers";
import { DataTable, TableActions } from "@/shared/table";

// ❌ relative
import { useProductListQuery } from "../../features/product";

// ❌ reaching past a folder's index.ts
import { formatMoney } from "@/shared/helpers/formatters";
import DataTable from "@/shared/table/DataTable";
```

**One import line per folder.** Four symbols from `@/shared/helpers` is one statement, not
four.

The only relative-style exception is a **sibling inside the same folder** — a file must not
import its own folder's barrel, because that is a cycle. Address the sibling directly:

```ts
// inside src/shared/table/DataTable.tsx
import { TableFooter } from "@/shared/ui";        // ✅ another folder → its barrel
import TableText from "@/shared/table/TableText"; // ✅ sibling → direct, no cycle
import { TableText } from "@/shared/table";       // ❌ imports its own barrel
```

### 5.2 Internationalisation

- Default language `uz`; `ru` and `en` must stay key-complete with it.
- A key missing in one language is a bug — it renders the raw key to the user.
- **Every** user-visible string goes through `t()`. No literal UI text in JSX.
- Read the language with `useCurrentLanguage()`; never derive it from `i18n.language`.
- Key names describe the location and meaning: `pages.product.no-data`,
  `common.buttons.save`, `notifications.auth.code-expired`.
- A key's **name must survive a wording change**. If the text changes meaning, rename the
  key too — `time-left` renamed to `resend-in` when it started gating a resend button.

### 5.3 Server state vs client state

| State                          | Home                     |
| ------------------------------ | ------------------------ |
| Anything fetched from the API  | react-query, always      |
| Multi-step form drafts         | Redux slice in `model/`  |
| Modal open / selected row / UI | local `useState`         |
| Pagination + filters           | `usePaginatedParams`     |

Never duplicate server data into Redux "for convenience". Two sources of truth diverge.

### 5.4 Forms

- `react-hook-form` + `zodResolver`, schema in `validations/create<Domain>.ts`.
- Bind inputs through `shared/form-field/` components, not raw antd inputs.
- Validate on the client for UX; treat the server as the authority.

### 5.5 Styling

- Tailwind utilities. Colours come from `tailwind.config.js` tokens (`text-brand`,
  `bg-bg-page`), never raw hex in JSX.
- A component accepting `className` MUST merge with `cn()`.
- No CSS modules, no styled-components, no inline `style` except for values that genuinely
  cannot be expressed as a class (a computed pixel width, a dynamic background image).

### 5.6 Environment variables

- Declared in `.env.example`, read only in `shared/constants/envURI.ts`.
- Values are **not** quoted in `.env` — Vite keeps quotes literally.
- `.env` is git-ignored and MUST NOT be committed.

### 5.7 Error handling

- API errors surface as translated user-facing messages. A raw English server string in the
  UI is a defect.
- Unexpected render errors are caught by an error boundary, not left to blank the screen.
- A failed mutation MUST tell the user something happened. Silent failure is the worst
  outcome — worse than a wrong message.

---

## 6. How to Add a New Feature

### 6.1 Full CRUD checklist

```
1.  cp -r src/features/_template src/features/<domain>
2.  Rename every `template`/`Template` occurrence to your domain.
3.  api/<domain>Api.ts          — urls object + CRUD methods
4.  types/<domain>.ts           — request/response shapes (no `Type` suffix)
5.  hooks/use<Domain>Query.ts   — Query/Mutation hooks, invalidation wired
6.  validations/create<Domain>.ts — Zod schema (if the feature has forms)
7.  pages/<Domain>Page.tsx      — list screen via DataTable
8.  pages/sections/…            — extract once the page passes ~200 lines
9.  index.ts                    — export ONLY what other features need
                                  (skip the file entirely if nothing does)
10. routes/path.ts              — add the path constants
11. routes/Routes.tsx           — lazy() the page under the right layout
12. layout/navItems.ts          — add the sidebar entry + its role filter
13. public/locales/{uz,ru,en}   — add every key, in all three languages
14. npm run typecheck && npm run lint && npm run build
15. Run the §7 audit — all six checks must print `clean`
```

### 6.2 Adding a page to an existing feature

```
1. pages/<Domain><Screen>Page.tsx
2. routes/path.ts               — new constant
3. routes/Routes.tsx            — new lazy() entry
4. locales — all three languages
5. `pages/index.ts` — add the new page to the folder barrel.
6. Feature root `index.ts` — only if another feature needs it. Usually it does not.
```

### 6.3 Promoting a component to `shared/`

Only when **both** hold:

1. A second feature genuinely needs it, **and**
2. it can be stripped of all domain knowledge — no domain types in its props, no domain
   hooks inside.

If (2) fails, the component stays in its feature and the second feature composes around it.
"Nine shared folders with exactly one consumer" is the failure mode this rule prevents.

---

## 7. Auditing

Structural rot is measurable, so it is measured. **Do not hand-run greps and do not
reimplement these checks — run the script:**

```bash
node scripts/audit.mjs
```

It exits `0` when everything passes and `1` on any violation, printing the offending file
and line. It has no dependencies.

### The verification gate

Every change, before it is called done:

```bash
npm run typecheck && npm run lint && node scripts/audit.mjs && npm run build
```

### What it enforces

| #  | Check                              | Rule it protects                                    |
| -- | ---------------------------------- | --------------------------------------------------- |
| 1  | Feature internals from outside     | §3.2 — only `Routes.tsx`, only a page file          |
| 2  | Cross-feature internals            | §1 — go through `@/features/<domain>`               |
| 3  | `shared/` importing a feature      | §3.11 — the load-bearing rule                       |
| 4  | Duplicate component names          | §3.7 — duplicates mask each other in every audit    |
| 5  | Missing barrel / reaching past one | §3.10 — every folder has an `index.ts`              |
| 6  | Relative imports                   | §5.1 — always `@/`                                  |
| 7  | Broken asset or module references  | below — TypeScript cannot see these                 |
| 8  | Formatting inside a component      | §3B — it belongs in `@/shared/helpers`              |
| 9  | Hook naming                        | §3.5 — `Query` / `Mutation`, never `Mutate`         |
| 10 | `Type`-suffixed files in `types/`  | §3.6                                                |
| 11 | Hardcoded route strings            | §3.2 — `paths.*`                                    |
| 12 | A file importing its own barrel    | §3.10 — that is a cycle                             |

**Check 7 matters more than it looks.** Fonts, icons and images are referenced from `.css`
`url()` and from `index.html`, neither of which the TypeScript compiler reads. A move that
relocates `index.css` or an `assets/` folder silently breaks every one of them, and Vite
reports a successful build while emitting no font at all. Run the audit after **any** file
move.

**Never edit `scripts/audit.mjs` to make a task pass.** If a check fires, the design is
wrong, not the check. If a rule genuinely needs to change, change it deliberately — in
`ARCHITECTURE.md` first, then the script, then this table.

### The one check a script cannot do: dead exports

Barrels keep modules *reachable*, so "is this file imported anywhere?" answers yes for a
file nothing uses. Because this project puts an `index.ts` in every folder, **nothing but a
deliberate pass will ever surface that rot.** Run it before every release:

resolve every import to a file, collect the names each barrel re-exports, and flag any name
referenced *only* by its own module and its barrel. Iterate to a fixpoint — deleting one
dead component usually orphans two more. Two traps:

- A file exported twice under different names (`MetricsCard` **and** `StatisticCard`) is
  alive if *either* name is used. Check every alias before deleting.
- Two files sharing a basename mask each other. Audit check 4 must be green first.

---

## 8. Conventions Cheat-sheet

### Naming law

| Layer                      | File                              | Exported symbol                            |
| -------------------------- | --------------------------------- | ------------------------------------------ |
| `features/<d>/api/`        | `<domain>Api.ts`                  | `<domain>Api`                              |
| `features/<d>/hooks/`      | `use<Domain>Query.ts`             | `use<Domain><Action>Query` / `…Mutation`   |
| `features/<d>/types/`      | `<shape>.ts` camelCase            | `PascalCase` interfaces                    |
| `features/<d>/model/`      | `<domain>Slice.ts`                | `<domain>Slice`                            |
| `features/<d>/components/` | `PascalCase.tsx`                  | matches the filename exactly               |
| `features/<d>/pages/`      | `<Domain><Role?>Page.tsx`         | matches the filename exactly               |
| `features/<d>/validations/`| `create<Domain>.ts`               | `create<Domain>Schema`                     |
| `shared/**`                | `PascalCase.tsx` / `camelCase.ts` | matches the filename                       |
| `routes/`                  | `path.ts`                         | `paths` (SCREAMING_SNAKE keys)             |

### Obligations — MUST

**Structure and imports**

1. Every folder holding modules has an `index.ts`.
2. Every import is absolute (`@/…`) and addresses a **folder**, never a file inside it.
3. Barrels themselves use absolute `@/` paths.
4. Every cross-feature import goes through `@/features/<domain>`.
5. Every path is a `paths.*` constant.

**Reuse**

6. Anything that exists in **two** places becomes a reusable module immediately.
7. An extraction replaces **every** occurrence — the original is deleted.
8. A reusable component takes data through props, carries no domain types, and fetches
   nothing itself.

**Formatting**

9. All formatting lives in `@/shared/helpers` and is called by name.
10. Helpers are pure and tolerate `null` / `undefined`.
11. Requests carry parsed values (`parseMoneyInput`, `toApiDate`), never display strings.

**Data and UI**

12. Every data hook ends in `Query` or `Mutation`.
13. Every mutation invalidates the query keys it affects.
14. Every list screen uses `DataTable`.
15. Every component taking `className` merges with `cn()`.
16. Every component filename equals its exported name.

**Process**

17. Every user-visible string goes through `t()`, in all three languages.
18. Every language read uses `useCurrentLanguage()`.
19. Every `VITE_*` variable is declared in `.env.example`.
20. `npm run typecheck` passes before every commit.
21. All six §7 audit checks print `clean` before every merge.
22. The dead-export pass runs before every release — barrels hide dead code, so nothing
    else will catch it.

### Prohibitions — MUST NOT

**Imports and structure**

1. **Never** write a relative import (`../`, `./`) across folders — always `@/`.
2. **Never** import a file that sits next to an `index.ts` — address the folder.
   (Exceptions: a sibling inside the same folder, and `Routes.tsx` lazy targets.)
3. **Never** import `@/features/x/<anything>` from outside feature `x` — use
   `@/features/x`.
4. **Never** import `@/features/…` from `shared/`.
5. **Never** re-export a child folder's barrel from a parent barrel.
6. **Never** let a file import its own folder's `index.ts` — that is a cycle.
7. **Never** create a re-export shim whose only content is one re-export.
8. **Never** leave an export in a feature root `index.ts` with no cross-feature consumer.

**Reuse**

9. **Never** copy-paste markup or logic. The second occurrence is an extraction.
10. **Never** leave the original in place after extracting.
11. **Never** put a domain type in a `shared/` component's props.
12. **Never** let a reusable component fetch its own data.
13. **Never** branch a shared component on who is calling it
    (`if (page === "product")`) — that is a prop.
14. **Never** move something to `shared/` for reuse that has not happened yet.

**Formatting**

15. **Never** format inside a component, an input handler, or a table column.
16. **Never** define `getLocalizedValue`, `formatMoneyInput`, or `currentLanguage` locally.
17. **Never** add a display ternary for `null` — the helper already returns the placeholder.
18. **Never** send a formatted display string in a request body.

**Naming and layering**

19. **Never** put a routed page anywhere but `features/<d>/pages/`.
20. **Never** name a sub-folder of `pages/` anything but `sections/`.
21. **Never** name a hook `use<Thing>Mutate`.
22. **Never** add a `Type` suffix to a file under `types/`.
23. **Never** let two components share a name anywhere in `src/`.
24. **Never** store server data in Redux.

**Practice**

25. **Never** hardcode a URL path, a hex colour, or a UI string.
26. **Never** hand-roll a table, a pagination footer, or `Modal.confirm`.
27. **Never** write `handleSetPage = useCallback((p) => setPage(p), [setPage])` — pass
    `setPage` directly. (A wrapper with *real* conditional logic is fine.)
28. **Never** use `clsx()` where a caller's `className` must win — use `cn()`.
29. **Never** commit `.env`.
30. **Never** silence a linter with `// eslint-disable` to land a violation. Fix the design.

### Hard Rules Summary

1. Every module folder — **MUST** have an `index.ts`.
2. Every import — **MUST** be `@/` and address a folder, not a file.
3. `shared/` importing `features/` — **FORBIDDEN**, no exception.
4. Reaching past a feature root's `index.ts` — **FORBIDDEN**, except `Routes.tsx` → a page
   file.
5. A parent barrel re-exporting child barrels — **FORBIDDEN**.
6. Anything repeated twice — **MUST** become a reusable module, and the original deleted.
7. Formatting inside a component or input — **FORBIDDEN**. It lives in `@/shared/helpers`.
8. Server state in Redux — **FORBIDDEN**.
9. Two components with the same name — **FORBIDDEN**.
10. `types/` filenames — **MUST NOT** carry a `Type` suffix.
11. Data hooks — **MUST** end in `Query` or `Mutation`.
12. Route paths — **MUST** come from `paths.*`.
13. `className`-accepting components — **MUST** use `cn()`, not `clsx()`.
14. The dead-export pass — **MUST** run before every release.

---

## 9. Design Notes Worth Keeping

Rules earned the hard way. Each one cost real debugging time.

**Barrels hide dead code — this is the price of the import style, and it must be paid.**
A barrel keeps a module reachable, so "is this imported anywhere?" answers yes for a file
nothing actually uses. Removing barrels from a mature codebase routinely exposes thousands
of lines that had looked alive for years. Because this project puts an `index.ts` in every
folder, the structure will never surface that rot on its own: the §7 dead-export pass is
the only thing that will, so it runs before every release. Audit **exported names**, not
file paths.

**`clsx` is not `cn`.** A shared component that concatenates classes gives callers an
override that only works by accident of CSS source order. Every "why won't my `px-8`
apply?" traces back to this.

**A shared component used as an antd overlay trigger needs `forwardRef`.** `Dropdown`,
`Tooltip` and `Popconfirm` attach a ref and their own handlers to the trigger child. A
function component without `forwardRef` silently misbehaves — no error, just a dropdown
that does not open.

**A component that accepts `children` must render them.** Destructuring `children` into
`...restProps` and spreading onto an element that already has JSX children drops them
silently: explicit JSX children always win over `props.children`.

**HTTP 200 is not success.** Check the body shape before trusting a resolved promise.

**`danger` is not one style.** In antd, `<Button danger>` is an *outlined* red button while
`<Button type="primary" danger>` is a *filled* one. A migration that maps both to one
variant changes the look of every secondary destructive action in the app.

**Timer effects must not depend on their own tick.** `useEffect(..., [countdown])` tears
down and rebuilds the interval every second. Depend on the boolean that starts and stops
it (`isLocked`), not on the value that changes with every tick.
