#!/usr/bin/env node
/**
 * Scans the repository and writes content.json.
 *
 * Nothing here is hand-maintained: drop a folder in projects/, a logo in
 * clients/, or a new cv.pdf in about/, and the next run picks it up.
 *
 * Run locally with:  node tools/build-content.mjs
 * CI runs it on every push (see .github/workflows/deploy.yml).
 */

import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, extname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const IMAGE = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg']);
const VIDEO = new Set(['.mp4', '.webm', '.mov', '.m4v']);

/* ── tiny helpers ─────────────────────────────────────────────────────── */

const read = p => readFileSync(p, 'utf8');
const isDir = p => existsSync(p) && statSync(p).isDirectory();
const posix = p => relative(ROOT, p).split(/[\\/]/).join('/');

const dirs = p => (isDir(p) ? readdirSync(p, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'))
  .map(d => d.name).sort(natural) : []);

const files = p => (isDir(p) ? readdirSync(p, { withFileTypes: true })
  .filter(d => d.isFile() && !d.name.startsWith('.'))
  .map(d => d.name).sort(natural) : []);

/** "02.jpg" sorts before "10.jpg" — plain sort would not. */
function natural(a, b) {
  return a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });
}

/** Short content hash, used to bust caches when a file is replaced in place. */
function hash(p) {
  try { return createHash('sha1').update(readFileSync(p)).digest('hex').slice(0, 8); }
  catch { return null; }
}

/** "01-logos" -> "logos";  "04-xr" -> "xr" */
const unprefix = name => name.replace(/^\d+[-_.\s]*/, '');

const titleize = s => unprefix(s).replace(/[-_]+/g, ' ').trim();

/* ── front matter ─────────────────────────────────────────────────────── */

/**
 * Parses the YAML subset the project files actually use: `key: value`
 * scalars and `- item` lists. Deliberately not a full YAML parser — this
 * keeps the build dependency-free.
 */
function frontMatter(src) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (!m) return { data: {}, body: src };

  const data = {};
  let key = null;

  for (const raw of m[1].split(/\r?\n/)) {
    if (!raw.trim() || /^\s*#/.test(raw)) continue;

    const item = /^\s*-\s+(.*)$/.exec(raw);
    if (item && key) {
      (Array.isArray(data[key]) ? data[key] : (data[key] = [])).push(unquote(item[1]));
      continue;
    }

    const pair = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(raw);
    if (!pair) continue;

    key = pair[1];
    const value = pair[2].trim();
    data[key] = value === '' ? [] : unquote(value);
  }

  return { data, body: src.slice(m[0].length) };
}

function unquote(v) {
  const s = String(v).trim().replace(/\s+#.*$/, '').trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

const list = v => (Array.isArray(v) ? v.filter(Boolean) : v ? [v] : []);

/* ── markdown ─────────────────────────────────────────────────────────── */

const escapeHtml = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/** Inline markdown -> HTML. Links, bold, italic, code. Nothing else. */
function inline(md) {
  return escapeHtml(md)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) => {
      const tag = text.replace(/[^A-Za-z0-9 ]/g, '').trim().toUpperCase().slice(0, 24) || 'LINK';
      const external = /^https?:/i.test(href);
      return `<a href="${href}"${external ? ' target="_blank" rel="noopener"' : ''} data-tag="${tag}">${text}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

/** Splits a markdown body into `{ [heading]: html }`, keyed by lowercase heading. */
function sections(body) {
  const out = {};
  let key = '_intro';
  let buf = [];

  const flush = () => {
    const text = buf.join('\n').trim();
    if (text) {
      out[key] = text.split(/\n{2,}/).map(p => inline(p.trim().replace(/\n/g, ' '))).join('\n');
    }
    buf = [];
  };

  for (const line of body.split(/\r?\n/)) {
    const h = /^#{1,6}\s+(.*)$/.exec(line);
    if (h) { flush(); key = h[1].trim().toLowerCase(); }
    else buf.push(line);
  }
  flush();
  return out;
}

/** First section matching any of `names`, else null. */
const pick = (secs, names) => {
  for (const n of names) if (secs[n]) return secs[n];
  return null;
};

/* ── projects ─────────────────────────────────────────────────────────── */

/** Sensible defaults so the five shipped categories keep their labels. */
const CATEGORY_DEFAULTS = {
  logos:   { sub: 'MARKS & IDENTITY',    kind: 0 },
  posters: { sub: 'PRINT & EDITORIAL',   kind: 1 },
  '3d':    { sub: 'FORM & RENDER',       kind: 2 },
  xr:      { sub: 'SPATIAL & REALTIME',  kind: 3 },
  motion:  { sub: 'TIME & SEQUENCE',     kind: 4 }
};

function readCategory(dir, name, index) {
  const slug = unprefix(name).toLowerCase();
  const fallback = CATEGORY_DEFAULTS[slug] || {};
  let data = {};

  for (const candidate of ['category.md', 'index.md', 'category.yml']) {
    const p = join(dir, candidate);
    if (existsSync(p)) { data = frontMatter(read(p)).data; break; }
  }

  return {
    key: String(data.key || data.title || titleize(name)).toUpperCase(),
    sub: String(data.sub || fallback.sub || titleize(name)).toUpperCase(),
    kind: Number.isFinite(+data.kind) && data.kind !== ''
      ? +data.kind
      : (fallback.kind ?? index % 5),
    order: Number.isFinite(+data.order) && data.order !== '' ? +data.order : index
  };
}

function readProject(dir, folder) {
  const mdName = files(dir).find(f => f.toLowerCase() === 'index.md')
    || files(dir).find(f => extname(f).toLowerCase() === '.md');

  const { data, body } = mdName ? frontMatter(read(join(dir, mdName))) : { data: {}, body: '' };
  const secs = sections(body);

  const all = files(dir);
  const images = all.filter(f => IMAGE.has(extname(f).toLowerCase()));
  const videos = all.filter(f => VIDEO.has(extname(f).toLowerCase()));

  // A named cover wins; otherwise anything called cover.*; otherwise the first image.
  const named = data.cover && images.find(f => f.toLowerCase() === String(data.cover).toLowerCase());
  const conventional = images.find(f => /^cover\./i.test(f));
  const cover = named || conventional || images[0] || null;

  const gallery = images.filter(f => f !== cover).map(f => posix(join(dir, f)));

  const work = {
    slug: folder,
    t: String(data.title || titleize(folder)).toUpperCase(),
    c: data.client || '',
    y: String(data.year || ''),
    r: data.role || '',
    order: Number.isFinite(+data.order) && data.order !== '' ? +data.order : 999,

    img: cover ? posix(join(dir, cover)) : null,
    video: videos[0] ? posix(join(dir, videos[0])) : null,
    gallery,

    link: data.link || null,
    tag: data.tag ? String(data.tag).toUpperCase() : null,
    lb: data.label_overview ? String(data.label_overview).toUpperCase() : null,
    la: data.label_contribution ? String(data.label_contribution).toUpperCase() : null,

    b: pick(secs, ['overview', 'brief', 'about', '_intro']) || '',
    a: pick(secs, ['contribution', 'approach', 'process', 'role']) || '',
    credit: pick(secs, ['credit', 'credits', 'thanks']) || null,

    clients: list(data.clients),
    roles: list(data.roles)
  };

  if (!work.clients.length) delete work.clients;
  if (!work.roles.length) delete work.roles;

  return work;
}

function buildFields(config) {
  const base = join(ROOT, 'projects');
  const fields = [];

  dirs(base).forEach((name, i) => {
    const dir = join(base, name);
    const meta = readCategory(dir, name, i);

    const works = dirs(dir)
      .map(f => readProject(join(dir, f), f))
      .sort((a, b) => a.order - b.order || natural(a.slug, b.slug));

    if (!works.length && !config.show_empty_categories) return;
    fields.push({ ...meta, works });
  });

  return fields.sort((a, b) => a.order - b.order);
}

/* ── clients ──────────────────────────────────────────────────────────── */

function buildClients() {
  const dir = join(ROOT, 'clients');
  return files(dir)
    .filter(f => IMAGE.has(extname(f).toLowerCase()))
    .map(f => ({
      name: basename(f, extname(f)).replace(/[-_]+/g, ' ').trim(),
      src: posix(join(dir, f))
    }));
}

/** Every project doubles as an engagement row — no second list to maintain. */
function buildEngagements(fields) {
  const rows = [];
  for (const f of fields) {
    for (const w of f.works) {
      const client = (w.clients && w.clients[0]) || w.c;
      if (!client) continue;
      const scope = (w.roles && w.roles[0]) || w.r || f.key;
      rows.push({ name: String(client).toUpperCase(), scope: String(scope).toUpperCase(), year: w.y });
    }
  }
  const seen = new Set();
  return rows
    .filter(r => {
      const id = `${r.name}|${r.scope}|${r.year}`;
      return seen.has(id) ? false : (seen.add(id), true);
    })
    .sort((a, b) => (b.year || '').localeCompare(a.year || ''));
}

/* ── about ────────────────────────────────────────────────────────────── */

function buildAbout(config) {
  const dir = join(ROOT, 'about');
  const all = files(dir);

  const portraitFile = all.find(f => /^(me|portrait|profile)\./i.test(f))
    || all.find(f => IMAGE.has(extname(f).toLowerCase()));

  const mdName = all.find(f => /^(about|index|bio)\.md$/i.test(f));
  const { data, body } = mdName ? frontMatter(read(join(dir, mdName))) : { data: {}, body: '' };
  const secs = sections(body);

  const cvFile = all.find(f => /\.pdf$/i.test(f) && /^(cv|resume|resumé)\./i.test(f))
    || all.find(f => /\.pdf$/i.test(f));

  let cv = null;
  if (cvFile) {
    const p = join(dir, cvFile);
    cv = {
      src: posix(p),
      hash: hash(p),
      updated: statSync(p).mtime.toISOString().slice(0, 10),
      size: Math.max(1, Math.round(statSync(p).size / 1024)) + ' KB'
    };
  }

  const paragraphs = Object.entries(secs)
    .filter(([k]) => k === '_intro' || k === 'bio' || k === 'about')
    .map(([, v]) => v)
    .join('\n')
    .split('\n')
    .filter(Boolean);

  return {
    portrait: portraitFile ? posix(join(dir, portraitFile)) : null,
    caption: String(data.caption || config.name || '').toUpperCase(),
    headline: data.headline || '',
    paragraphs,
    practice: secs.practice || null,
    cv
  };
}

/* ── config ───────────────────────────────────────────────────────────── */

function loadConfig() {
  const p = join(ROOT, 'site.config.json');
  const defaults = {
    name: '', role: '', email: '', links: {}, details: {},
    clients_lede: '', show_empty_categories: false
  };
  if (!existsSync(p)) return defaults;
  try { return { ...defaults, ...JSON.parse(read(p)) }; }
  catch (err) {
    console.error('site.config.json is not valid JSON — using defaults.\n ', err.message);
    return defaults;
  }
}

/* ── main ─────────────────────────────────────────────────────────────── */

const config = loadConfig();
const fields = buildFields(config);
const clients = buildClients();

const content = {
  generated: new Date().toISOString(),
  site: {
    name: config.name,
    role: config.role,
    email: config.email,
    links: config.links,
    details: config.details
  },
  about: buildAbout(config),
  clients: { lede: config.clients_lede, logos: clients, engagements: buildEngagements(fields) },
  fields
};

writeFileSync(join(ROOT, 'content.json'), JSON.stringify(content, null, 2) + '\n');

const works = fields.reduce((n, f) => n + f.works.length, 0);
console.log(
  `content.json written\n` +
  `  ${fields.length} categories, ${works} projects, ${clients.length} client logos\n` +
  `  cv: ${content.about.cv ? content.about.cv.src + ' (updated ' + content.about.cv.updated + ')' : 'none found'}`
);
for (const f of fields) {
  console.log(`  ${f.key.padEnd(10)} ${f.works.map(w => w.slug).join(', ') || '(empty)'}`);
}
