#!/usr/bin/env node
/**
 * Architecture audit. Run it; do not reimplement it.
 *
 *   node scripts/audit.mjs
 *
 * Exits 0 when every check passes, 1 otherwise. Every rule enforced here is
 * documented in README.md — the numbers below match its §7.
 *
 * No dependencies. Node 18+.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname, basename, extname } from "node:path";

const SRC = "src";
const CODE = new Set([".ts", ".tsx"]);
const ASSET_EXT = ["", ".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".svg", ".png",
                   ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".ttf", ".woff", ".woff2"];

/** Folders holding only other folders — exempt from the barrel rule (README §3.10). */
const NO_BARREL = new Set(["src", "src/shared", "src/features", "src/layout"]);
/** The one file allowed to import a page module directly, for lazy() chunking. */
const LAZY_HOST = "src/routes/Routes.tsx";

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};
const dirs = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { out.push(p); dirs(p, out); }
  }
  return out;
};

const norm = (p) => p.split("\\").join("/");
const files = existsSync(SRC) ? walk(SRC).map(norm) : [];
const code = files.filter((f) => CODE.has(extname(f)));
const read = (f) => readFileSync(f, "utf8");

const checks = [];
const check = (n, title, run) => checks.push({ n, title, run });

/* 1 ─ feature internals reached from outside ------------------------------- */
check(1, "Feature internals reached from outside", () => {
  const bad = [];
  for (const f of code) {
    if (f.startsWith("src/features/") || f === LAZY_HOST) continue;
    for (const m of read(f).matchAll(/['"]@\/features\/([a-z_-]+)\/([^'"]+)['"]/g)) {
      bad.push(`${f} -> @/features/${m[1]}/${m[2]}`);
    }
  }
  return bad;
});

/* 2 ─ one feature reaching into another's internals ------------------------ */
check(2, "A feature reaching into another feature's internals", () => {
  const bad = [];
  for (const f of code) {
    if (!f.startsWith("src/features/")) continue;
    const own = f.split("/")[2];
    for (const m of read(f).matchAll(/['"]@\/features\/([a-z_-]+)\/([^'"]+)['"]/g)) {
      if (m[1] !== own) bad.push(`${f} -> @/features/${m[1]}/${m[2]}`);
    }
  }
  return bad;
});

/* 3 ─ shared importing a feature ------------------------------------------- */
check(3, "shared/ importing a feature", () => {
  const bad = [];
  for (const f of code.filter((x) => x.startsWith("src/shared/"))) {
    if (/@\/features\//.test(read(f))) bad.push(f);
  }
  return bad;
});

/* 4 ─ duplicate component names -------------------------------------------- */
check(4, "Duplicate component names", () => {
  const seen = new Map();
  for (const f of files.filter((x) => extname(x) === ".tsx")) {
    const b = basename(f);
    seen.set(b, [...(seen.get(b) ?? []), f]);
  }
  return [...seen.entries()].filter(([, v]) => v.length > 1)
    .map(([k, v]) => `${k}: ${v.join(", ")}`);
});

/* 5 ─ barrels: every module folder has one; nothing reaches past one -------- */
check(5, "Missing barrels / imports reaching past a barrel", () => {
  const bad = [];
  for (const d of (existsSync(SRC) ? dirs(SRC).map(norm) : [])) {
    if (NO_BARREL.has(d)) continue;
    const mods = readdirSync(d).filter(
      (n) => CODE.has(extname(n)) && basename(n, extname(n)) !== "index",
    );
    if (mods.length && !existsSync(join(d, "index.ts"))) bad.push(`missing barrel: ${d}`);
  }
  for (const f of code) {
    if (f === LAZY_HOST) continue;
    for (const m of read(f).matchAll(/from\s+['"]@\/([^'"]+)['"]/g)) {
      const target = join(SRC, m[1]);
      if (existsSync(target) && statSync(target).isDirectory()) continue;
      const parent = norm(dirname(target));
      if (parent === norm(dirname(f))) continue;            // sibling: allowed
      if (existsSync(join(parent, "index.ts"))) {
        bad.push(`${f}: reaches past @/${relative(SRC, parent).split("\\").join("/")}`);
      }
    }
  }
  return bad;
});

/* 6 ─ relative imports across folders -------------------------------------- */
check(6, "Relative imports", () => {
  const bad = [];
  for (const f of code) {
    for (const m of read(f).matchAll(/from\s+['"](\.\.?\/[^'"]+)['"]/g)) {
      bad.push(`${f}: ${m[1]}`);
    }
  }
  return bad;
});

/* 7 ─ broken asset/module references --------------------------------------- */
check(7, "Broken asset or module references", () => {
  const bad = [];
  const resolves = (base) =>
    ASSET_EXT.some((e) => existsSync(base + e)) ||
    ["index.ts", "index.tsx"].some((i) => existsSync(join(base, i)));
  for (const f of files.filter((x) => CODE.has(extname(x)) || extname(x) === ".css")) {
    const re = /(?:from\s+|import\s*\(\s*|import\s+|url\(\s*)['"]([^'"]+)['"]/g;
    for (const m of read(f).matchAll(re)) {
      const s = m[1];
      let base = null;
      if (s.startsWith("@/")) base = join(SRC, s.slice(2));
      else if (s.startsWith(".")) base = join(dirname(f), s);
      if (base && !resolves(base)) bad.push(`${f}: ${s}`);
    }
  }
  if (existsSync("index.html")) {
    for (const m of read("index.html").matchAll(/(?:src|href)="(\/[^"]*)"/g)) {
      if (!existsSync(m[1].slice(1))) bad.push(`index.html: ${m[1]}`);
    }
  }
  return bad;
});

/* 8 ─ formatting written inside a component -------------------------------- */
check(8, "Formatting inside a component (belongs in @/shared/helpers)", () => {
  const bad = [];
  const SMELLS = [
    [/\.toFixed\s*\(/, ".toFixed()"],
    [/\.toLocaleDateString\s*\(/, ".toLocaleDateString()"],
    [/\.toLocaleString\s*\(/, ".toLocaleString()"],
    [/Intl\.(NumberFormat|DateTimeFormat)/, "Intl.*Format"],
    [/replace\(\s*\/\\D\/g/, "replace(/\\D/g, …)"],
    [/dayjs\([^)]*\)\.format\s*\(/, "dayjs().format()"],
  ];
  for (const f of code) {
    // helpers are exactly where this belongs
    if (f.includes("/helpers/") || f.includes("/lib/")) continue;
    const lines = read(f).split("\n");
    lines.forEach((line, i) => {
      if (line.trimStart().startsWith("*") || line.trimStart().startsWith("//")) return;
      for (const [re, label] of SMELLS) {
        if (re.test(line)) bad.push(`${f}:${i + 1}: ${label}`);
      }
    });
  }
  return bad;
});

/* 9 ─ hook naming ----------------------------------------------------------- */
check(9, "Data hooks not ending in Query or Mutation", () => {
  const bad = [];
  for (const f of code.filter((x) => /\/hooks\//.test(x) && basename(x) !== "index.ts")) {
    for (const m of read(f).matchAll(/export const (use[A-Z]\w*)/g)) {
      const name = m[1];
      if (/(Query|Mutation)$/.test(name)) continue;
      if (/Mutate$/.test(name)) { bad.push(`${f}: ${name} — use the Mutation suffix`); continue; }
      // non-data hooks are exempt, but only when they touch no api module
      if (/@\/features\/[a-z_-]+\/api|baseApiClient|useQuery|useMutation/.test(read(f))) {
        bad.push(`${f}: ${name} — data hook must end in Query or Mutation`);
      }
    }
  }
  return bad;
});

/* 10 ─ types/ filenames carrying a Type suffix ------------------------------ */
check(10, "types/ filenames with a Type suffix", () =>
  code.filter((f) => /\/types\//.test(f) && /Type\.tsx?$/.test(basename(f))));

/* 11 ─ hardcoded route strings ---------------------------------------------- */
check(11, "Hardcoded route strings (use paths.*)", () => {
  const bad = [];
  for (const f of code) {
    if (f === "src/routes/path.ts") continue;
    const lines = read(f).split("\n");
    lines.forEach((line, i) => {
      if (/navigate\(\s*[`'"]\//.test(line)) bad.push(`${f}:${i + 1}: ${line.trim().slice(0, 70)}`);
      if (/<Navigate[^>]+to=["'`]\//.test(line)) bad.push(`${f}:${i + 1}: ${line.trim().slice(0, 70)}`);
    });
  }
  return bad;
});

/* 12 ─ a file importing its own folder's barrel (cycle) --------------------- */
check(12, "A file importing its own folder's barrel", () => {
  const bad = [];
  for (const f of code) {
    if (basename(f) === "index.ts") continue;
    const ownFolder = relative(SRC, dirname(f)).split("\\").join("/");
    const re = new RegExp(`from\\s+['"]@/${ownFolder}['"]`);
    if (re.test(read(f))) bad.push(f);
  }
  return bad;
});


/* 13 ─ a route built by hand instead of through to.* --------------------- */
check(13, "Route built with .replace() instead of a to.* builder", () => {
  const bad = [];
  for (const f of code) {
    if (f.startsWith("src/routes/")) continue;
    read(f).split("\n").forEach((line, i) => {
      if (/paths\.\w+\s*\.replace\s*\(/.test(line)) {
        bad.push(`${f}:${i + 1}: use to.* from @/routes — .replace() is not type-checked`);
      }
      if (/["'`]:\w+["'`]/.test(line) && /replace/.test(line)) {
        bad.push(`${f}:${i + 1}: a route param filled by hand`);
      }
    });
  }
  return bad;
});

/* ─────────────────────────────────────────────────────────────────────────── */
let failed = 0;
console.log("");
for (const { n, title, run } of checks) {
  let out = [];
  try { out = run() ?? []; }
  catch (e) { out = [`audit error: ${e.message}`]; }
  if (out.length === 0) {
    console.log(`  \x1b[32m✓\x1b[0m ${String(n).padStart(2)}. ${title}`);
  } else {
    failed += 1;
    console.log(`  \x1b[31m✗\x1b[0m ${String(n).padStart(2)}. ${title}  (${out.length})`);
    for (const line of out.slice(0, 20)) console.log(`        ${line}`);
    if (out.length > 20) console.log(`        … and ${out.length - 20} more`);
  }
}
console.log("");
if (failed) {
  console.log(`\x1b[31m${failed} check(s) failed.\x1b[0m Fix the design, not the audit.\n`);
  process.exit(1);
}
console.log("\x1b[32mAll checks passed.\x1b[0m\n");
