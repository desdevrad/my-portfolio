// scripts/build-manifest.mjs
//
// Scans /projects/<slug>/index.md files, and produces /projects.json
// in the exact shape the site's front-end expects:
//
//   [ { key, sub, kind, works: [ {t,c,y,r,b,a,img?,link?,tag?,lb?,la?,credit?,clients?,roles?} ] } ]
//
// Run with:  node scripts/build-manifest.mjs
// Requires:  npm install gray-matter marked

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const ROOT = process.cwd();
const PROJECTS_DIR = path.join(ROOT, 'projects');
const CATEGORIES_FILE = path.join(ROOT, 'categories.json');
const OUT_FILE = path.join(ROOT, 'projects.json');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function fail(msg) {
  console.error('✖ ' + msg);
  process.exitCode = 1;
}
function warn(msg) {
  console.warn('⚠ ' + msg);
}

// ── load category config ────────────────────────────────────────────────
if (!fs.existsSync(CATEGORIES_FILE)) {
  fail(`categories.json not found at ${CATEGORIES_FILE}`);
  process.exit(1);
}
const categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
const categoryByKey = new Map(categories.map(c => [c.key.toUpperCase(), { ...c, works: [] }]));

// ── inline markdown → HTML (no wrapping <p>, matches front-end's own <p> wrap) ──
function renderInline(md) {
  if (!md) return undefined;
  return marked.parseInline(String(md).trim());
}

// ── split the markdown body into ## sections ────────────────────────────
function parseSections(body) {
  const sections = {};
  const chunks = body.split(/\n(?=##\s+)/);
  for (const chunk of chunks) {
    const m = chunk.match(/^##\s+(.+?)\s*\n([\s\S]*)$/);
    if (!m) continue;
    sections[m[1].trim().toLowerCase()] = m[2].trim();
  }
  return sections;
}

// ── find the cover image for a project folder ───────────────────────────
function findCover(dir, fm) {
  let files = [];
  try {
    files = fs.readdirSync(dir).filter(f => IMAGE_EXT.has(path.extname(f).toLowerCase()));
  } catch { /* ignore */ }
  if (fm.cover && files.includes(fm.cover)) return fm.cover;
  const named = files.find(f => /^cover\./i.test(f));
  if (named) return named;
  files.sort();
  return files[0]; // may be undefined → front-end falls back to procedural art
}

// ── main ─────────────────────────────────────────────────────────────────
if (!fs.existsSync(PROJECTS_DIR)) {
  warn(`no /projects folder found — writing an empty manifest.`);
  fs.writeFileSync(OUT_FILE, JSON.stringify(categories.map(c => ({ ...c, works: [] })), null, 2));
  process.exit(0);
}

const slugs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
  .filter(e => e.isDirectory())
  .map(e => e.name)
  .sort();

let ok = 0, skipped = 0;

for (const slug of slugs) {
  const dir = path.join(PROJECTS_DIR, slug);
  const mdPath = path.join(dir, 'index.md');
  if (!fs.existsSync(mdPath)) {
    warn(`projects/${slug}/ has no index.md — skipped.`);
    skipped++;
    continue;
  }

  try {
    const raw = fs.readFileSync(mdPath, 'utf8');
    const { data: fm, content } = matter(raw);

    if (!fm.title) throw new Error('missing "title" in front matter');
    if (!fm.category) throw new Error('missing "category" in front matter');

    const cat = categoryByKey.get(String(fm.category).toUpperCase());
    if (!cat) {
      throw new Error(
        `category "${fm.category}" doesn't match any key in categories.json ` +
        `(valid: ${categories.map(c => c.key).join(', ')})`
      );
    }

    const sections = parseSections(content);
    const cover = findCover(dir, fm);

    const work = {
      t: String(fm.title),
      c: fm.client != null ? String(fm.client) : '',
      y: fm.year != null ? String(fm.year) : '',
      r: fm.role != null ? String(fm.role) : '',
      b: renderInline(sections['overview']) || '',
      a: renderInline(sections['contribution']) || '',
    };
    if (cover) work.img = `projects/${slug}/${cover}`;
    if (fm.link) work.link = String(fm.link);
    if (fm.tag) work.tag = String(fm.tag);
    if (fm.label_overview) work.lb = String(fm.label_overview);
    if (fm.label_contribution) work.la = String(fm.label_contribution);
    if (sections['credit']) work.credit = renderInline(sections['credit']);
    if (Array.isArray(fm.clients)) work.clients = fm.clients.map(String);
    if (Array.isArray(fm.roles)) work.roles = fm.roles.map(String);

    // internal-only, used for sorting, stripped before writing out
    Object.defineProperty(work, '_order', { value: fm.order, enumerable: false });
    Object.defineProperty(work, '_year', { value: Number(fm.year) || 0, enumerable: false });

    cat.works.push(work);
    ok++;
  } catch (err) {
    warn(`projects/${slug}/index.md skipped — ${err.message}`);
    skipped++;
  }
}

// sort works inside every category: explicit "order" first, then newest year, then title
for (const cat of categoryByKey.values()) {
  cat.works.sort((A, B) => {
    if (A._order != null && B._order != null) return A._order - B._order;
    if (A._order != null) return -1;
    if (B._order != null) return 1;
    if (A._year !== B._year) return B._year - A._year;
    return A.t.localeCompare(B.t);
  });
}

const manifest = categories.map(c => {
  const cat = categoryByKey.get(c.key.toUpperCase());
  return { key: cat.key, sub: cat.sub, kind: cat.kind, works: cat.works };
});

fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2));
console.log(`✔ projects.json written — ${ok} project(s) included, ${skipped} skipped.`);
