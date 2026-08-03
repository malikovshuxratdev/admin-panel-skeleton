# Architecture — The Structural Law

`README.md` documents *what* the structure is. This file records *why*, and is the authority
when the two appear to disagree. Read it before moving or creating a file.

---

## 1. Why feature-first

The obvious alternative is grouping by technical type:

```
src/
├── components/     # 200 files
├── hooks/          # 90 files
├── services/       # 60 files
└── pages/          # 70 files
```

This works until roughly the third domain, then fails in four predictable ways:

1. **Every folder becomes a dumping ground.** `components/` holds a date picker next to a
   product-specific pricing panel. Nothing tells you which is which.
2. **"Is this used?" stops having an answer.** A component in a shared folder might be used
   once, or never. You cannot tell without a full-text search, and a barrel makes even that
   lie.
3. **Deleting a domain is archaeology.** Its pieces are spread across nine directories, and
   you will miss some. They stay forever.
4. **Ownership dissolves.** No folder belongs to anyone, so no folder is maintained.

Feature-first fixes this **structurally**, not by discipline:

> **A feature's internals are unreachable from outside. Its only public surface is
> `index.ts`.**

`@/features/product/pages/sections/ProductTable` is not a path anyone may write. If a
feature needs something its neighbour does not export, that is a design conversation, not a
one-line import.

The payoff is concrete: deleting a domain is `rm -rf src/features/<d>` plus one route entry,
and reading its public surface takes ten seconds.

---

## 2. Layer model

```
app/  →  routes/  →  layout/  →  features/  ⇄  shared/
```

Dependencies point **downward only**. Nothing imports `app/`. `shared/` imports nothing from
`features/`.

| Layer       | Knows about                        | Must not know about              |
| ----------- | ---------------------------------- | -------------------------------- |
| `app/`      | everything                         | —                                |
| `routes/`   | layouts, feature **pages**         | feature internals other than pages |
| `layout/`   | shared, auth, roles                | any specific domain's data       |
| `features/` | shared, other features' `index.ts` | other features' internals        |
| `shared/`   | itself, third-party libraries      | **any** feature — no exceptions  |

### The three rules that matter

**1. `shared/` never imports `features/`.**
This is the load-bearing rule. Break it and the dependency graph becomes a cycle: `shared`
needs `product`, `product` needs `shared`, and neither can be understood, moved, or deleted
independently. If a shared module needs a domain, it is not shared — it belongs to that
domain.

**2. A feature never reaches past another feature's `index.ts`.**
The barrel is a contract. Deep imports turn every internal file into public API, which means
no internal refactor is ever safe again.

**3. Route-level `lazy()` is the one exception.**
`routes/Routes.tsx` may deep-import `features/<d>/pages/<X>Page`. Importing through the
barrel here would place the feature's entire public surface into the lazy chunk — every
hook, type and component it re-exports — and undo code splitting for every route at once.
This exception is limited to `pages/` modules, and to this one file.

---

## 3. What goes in `shared/` versus a feature

A module belongs in `shared/` only if **both** are true:

1. At least two features genuinely need it, **and**
2. it carries no domain knowledge — no domain types in its props, no domain hooks inside.

If (2) fails, it stays in its feature. The second consumer composes around it instead.

The failure this prevents has a name and a shape: nine "shared" component folders with
exactly one consumer each, created because someone anticipated reuse that never came.
**Anticipated reuse is not reuse.** Move a module to `shared/` on the day the second
consumer appears, not before.

### The two-strike rule

> **Written once. The second time it is needed, it is extracted — not copied.**

Two, not three. At two occurrences the extraction costs one edit and the copies are still
identical. By the fourth they have drifted, and the extraction has become a refactor with a
bug hunt attached: you no longer know which differences were intentional.

The extraction is only finished when **every** occurrence is replaced. An extraction that
leaves the original behind has made things strictly worse — now there are two
implementations *and* a shared one, and the next developer picks whichever they find first.

A piece is genuinely reusable only when it takes its data through props, carries no domain
types, fetches nothing itself, and varies by prop rather than by `if (caller === …)`. If it
fails any of those, extracting it produces a shared name over unshared behaviour, which is
worse than the duplication it replaced.

### Formatting is never local

The same rule, applied to values rather than markup: **a component does not format.**
`toFixed`, `replace(/\D/g, …)`, `toLocaleDateString`, `Intl.NumberFormat`, manual thousands
separators — all of it lives in `shared/helpers/` behind a name.

The reason is the same drift, on a shorter fuse. One money value appears in a table cell, a
detail card, a form field and an export. Formatted at each call site, those four disagree
within weeks — different rounding, different separator, different empty placeholder — and
when a bug is filed nobody can find every copy. One named function means one fix, and every
helper tolerating `null` means call sites never grow display ternaries either.

---

## 4. Barrels — one per folder

**Every folder that contains modules has an `index.ts`, and every import addresses a folder
through `@/`, never a file inside it.**

```ts
import { DataTable, TableActions } from "@/shared/table";   // ✅
import DataTable from "@/shared/table/DataTable";           // ❌
```

This buys a stable import surface: a file can move inside its folder, or split into three,
without touching a single caller. It is a deliberate trade, and the other side of it is
real.

### What it costs

**Barrels hide dead code.** A barrel keeps a module *reachable*, so "is this file imported
anywhere?" answers yes for a file nothing actually uses. In a codebase with barrels
everywhere, structure will never surface that rot. Removing barrels from a mature project
routinely exposes thousands of lines that had looked alive for years.

The consequence is not "avoid barrels" — that decision is made. The consequence is that
**the dead-export audit is mandatory**, runs before every release, and audits *exported
names*, not file paths. Nothing else will catch it.

**Barrels inflate chunks.** Importing one symbol pulls in every module the barrel touches.
Two carve-outs exist purely to contain this:

1. **A parent folder never re-exports its children.** `src/shared/index.ts` re-exporting
   `table`, `ui`, `helpers` and the rest would make one import drag the whole kit into
   every chunk. Folders that hold only other folders — `src/`, `src/shared/`,
   `src/features/`, `src/layout/` — get **no** barrel.

2. **Route-level `lazy()` targets the page file.**

   ```ts
   const TemplatePage = lazy(() => import("@/features/x/pages/TemplatePage")); // ✅
   const TemplatePage = lazy(() => import("@/features/x/pages"));              // ❌
   ```

   Through the barrel, the chunk would contain every page in the feature, and code
   splitting would be defeated for that route.

### Cycles

A file **must not** import its own folder's `index.ts` — the barrel imports the file, the
file imports the barrel. Address a sibling directly instead:

```ts
// inside src/shared/table/DataTable.tsx
import { TableFooter } from "@/shared/ui";        // ✅ other folder → its barrel
import TableText from "@/shared/table/TableText"; // ✅ sibling → direct
import { TableText } from "@/shared/table";       // ❌ its own barrel
```

### The feature root barrel is still special

Every folder has a barrel, but `features/<domain>/index.ts` is the one that is a
**contract**: it is the mechanism that makes a feature's internals unreachable from
outside. Export what neighbours genuinely need. An export there with no cross-feature
consumer is dead weight, and the dead-export pass will flag it.

**Never create a shim file** whose entire content is one re-export. Point the barrel at the
real module.

---

## 5. Naming law

One rule per layer. No exceptions, no second style.

| Layer                      | File                              | Exported symbol                          |
| -------------------------- | --------------------------------- | ---------------------------------------- |
| `features/<d>/api/`        | `<domain>Api.ts`                  | `<domain>Api`                            |
| `features/<d>/hooks/`      | `use<Domain>Query.ts`             | `use<Domain><Action>Query` / `…Mutation` |
| `features/<d>/types/`      | `<shape>.ts` camelCase            | `PascalCase` interfaces                  |
| `features/<d>/model/`      | `<domain>Slice.ts`                | `<domain>Slice`                          |
| `features/<d>/components/` | `PascalCase.tsx`                  | matches the filename                     |
| `features/<d>/pages/`      | `<Domain><Role?>Page.tsx`         | matches the filename                     |
| `shared/**`                | `PascalCase.tsx` / `camelCase.ts` | matches the filename                     |

Three consequences worth stating explicitly:

- **Every data hook ends in `Query` or `Mutation`.** Never `Mutate`, never a bare
  `useNews`. Non-data hooks (`useDrawerGuard`, `usePaginatedParams`) are exempt.
- **`types/` files carry no `Type` suffix.** The folder already says it.
- **Two components must never share a name anywhere in `src/`.** Duplicate basenames mask
  each other in every name-based audit: usage of `a/AuthorHeader` makes a name-based check
  believe `b/AuthorHeader` is alive. Qualify by domain instead —
  `OrderStatusField` / `ProductStatusField`.

---

## 6. `sections/` is the only sub-folder inside `pages/`

Not `parts/`, not `blocks/`, not `fragments/`. A section is a page-sized chunk of exactly one
screen. Sections are not reusable and must not be imported by another feature — the moment
two screens need the same piece, it is a component, and it moves to `components/`.

---

## 7. When a file grows

Line counts are not a rule, but they are a reliable signal:

| File                 | Signal at | What to do                                        |
| -------------------- | --------- | ------------------------------------------------- |
| routed page          | ~200      | extract into `pages/sections/`                    |
| hooks file           | ~400      | split by concern: `use<Domain><Concern>Query.ts`  |
| component            | ~250      | extract sub-components into the same folder       |

Splitting a hooks file is a real refactor, not a cosmetic one: update the barrel and every
call site in the same commit, and let `typecheck` prove you caught them all.

The failure mode to avoid: one `use<Domain>Query.ts` accumulating 28 hooks across four
unrelated concerns. Nobody can find anything in it, and every change touches it.

---

## 8. The audit is the enforcement

Conventions that are not checked decay. `README.md` §7 lists six mechanical checks; all must
print `clean`. Wire them into CI, and run check 6 (broken asset references) after **any**
file move — TypeScript cannot catch those, and Vite reports a successful build while
emitting no font at all.

---

## 9. Adding a feature — the short version

```
cp -r src/features/_template src/features/<domain>
rename template → <domain> everywhere
api → types → hooks → validations → pages → sections
index.ts   ONLY if another feature consumes something
routes/path.ts + routes/Routes.tsx + layout/navItems.ts
locales × 3
typecheck + lint + build + the six audits
```
