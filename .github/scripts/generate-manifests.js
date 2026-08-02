#!/usr/bin/env node
/* ============================================================
   Scans every top-level section folder (anything with both an
   index.html and a pages/ subfolder) and writes pages/manifest.json
   listing every .md file in it, with a title pulled from that
   file's first "# Heading" line (or a title-cased filename if
   there isn't one).

   Run manually with:  node .github/scripts/generate-manifests.js
   The GitHub Action runs this on every push and commits any
   resulting changes back to the repo.
   ============================================================ */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["assets", "node_modules", ".git", ".github", ".obsidian", ".trash"]);

function isSectionDir(name) {
  const full = path.join(ROOT, name);
  if (name.startsWith(".") || SKIP_DIRS.has(name)) return false;
  if (!fs.statSync(full).isDirectory()) return false;
  return (
    fs.existsSync(path.join(full, "index.html")) &&
    fs.existsSync(path.join(full, "pages")) &&
    fs.statSync(path.join(full, "pages")).isDirectory()
  );
}

function titleCase(slug) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Strips an optional leading ordering prefix like "01-" or "2_" so it
// controls sort order (via the filename) without showing up in the
// slug used for ?page=... links or in the title fallback.
function stripOrderPrefix(name) {
  return name.replace(/^\d+[-_.\s]+/, "");
}

function extractTitle(mdPath, fallbackSlug) {
  const text = fs.readFileSync(mdPath, "utf8");
  const match = text.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : titleCase(fallbackSlug);
}

function buildManifestForSection(sectionName) {
  const pagesDir = path.join(ROOT, sectionName, "pages");

  const files = fs
    .readdirSync(pagesDir)
    .filter((f) => f.toLowerCase().endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));

  const manifest = files.map((filename) => {
    const slug = stripOrderPrefix(filename.replace(/\.md$/i, ""));
    const title = extractTitle(path.join(pagesDir, filename), slug);
    return { slug, title, file: `pages/${filename}` };
  });

  const outPath = path.join(pagesDir, "manifest.json");
  const json = JSON.stringify(manifest, null, 2) + "\n";
  const existing = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : null;

  if (existing === json) {
    console.log(`[unchanged] ${sectionName}/pages/manifest.json`);
  } else {
    fs.writeFileSync(outPath, json);
    console.log(`[updated]   ${sectionName}/pages/manifest.json (${manifest.length} page(s))`);
  }
}

const sections = fs.readdirSync(ROOT).filter(isSectionDir);

if (sections.length === 0) {
  console.log("No section folders found (expected a folder with both index.html and pages/).");
} else {
  sections.forEach(buildManifestForSection);
}
