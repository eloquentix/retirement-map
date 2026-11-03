// Builds standalone pages from src/retirement-map.html, plus a static all.html landing page
// that links out to them. Each household page opens on one household only, so it can be sent
// on its own (email attachment or a public link). Deployed via ./deploy.sh.
// Every page carries a Content-Security-Policy: no network access, and no script except its own (allowed by hash).
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const SRC = new URL("./src/retirement-map.html", import.meta.url);
const src = readFileSync(SRC, "utf8");

const pages = [
  { file: "homes.html", only: "twohomes", title: "One Salary, Two Homes" },
  { file: "artist.html", only: "royalties", title: "Living on Royalties" },
  { file: "angels.html", only: "angel", title: "Angel Investor Map" },
  { file: "indie.html", only: "indie", title: "Independent Developer" },
];

// Links shown on the all.html landing page. Descriptions are copied from each persona's own
// `lede` in src/retirement-map.html — keep them in sync by hand if a lede changes.
const LANDING_LINKS = [
  { href: "angels.html", title: "Angel investor",
    desc: "Tech wealth, small start-up cheques and a power law. Pick an example size." },
  { href: "artist.html", title: "Living on royalties",
    desc: "Royalties from creative work as the main income, about €1M saved, and a home that is paid off." },
  { href: "indie.html", title: "Independent developer",
    desc: "A senior developer billing through a PFA or micro-SRL — crypto, stocks, bonds and property scattered across years of ad hoc decisions, and a state pension built on minimal contributions." },
  { href: "plan.html", title: "One salary, two homes",
    desc: "A single high earner, a partner who runs the household, a main home with a mortgage and a second home that is paid off — the polished EN | FR version." },
];

const replaceOnce = (s, from, to) => {
  if (!s.includes(from)) throw new Error(`build: marker not found: ${from}`);
  return s.replace(from, to);
};
const sha = (text) => `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`;

// Nothing may come from the network: no stylesheets, imports, remote scripts or remote images.
if (/<link\b|@import|url\(\s*["']?https?:|\bsrc\s*=\s*["']?https?:/i.test(src)) throw new Error("build: the page must not load anything from the network");

for (const p of pages) {
  let html = replaceOnce(src, "const ONLY = null;", `const ONLY = ${JSON.stringify(p.only)};`);
  html = replaceOnce(html, "<title>Retirement Map</title>", `<title>${p.title}</title>`);
  const [head, body] = html.split("<!--BODY-->");
  if (body === undefined) throw new Error("build: <!--BODY--> marker missing");
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => sha(m[1]));
  if (scripts.length !== 2) throw new Error(`build: expected 2 inline scripts, found ${scripts.length}`);
  const csp = `default-src 'none'; script-src ${scripts.join(" ")}; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'`;
  const out = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="${csp}">
${head.trim()}
</head>
<body>
${body.trim()}
</body>
</html>
`;
  writeFileSync(new URL(`./${p.file}`, import.meta.url), out);
  console.log(`wrote ${p.file} (${(out.length / 1024).toFixed(0)} KB)`);
}

// all.html: a static landing page, not an engine page — reuses src's own <title>/<style> (via
// the same <!--BODY--> split) for matching look and dark-mode support, but has no script of
// its own, so it needs no script-src at all.
{
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const [head] = src.split("<!--BODY-->");
  const csp = `default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'`;
  const links = LANDING_LINKS.map(
    (l) => `<a class="card link-card" href="${esc(l.href)}"><h2>${esc(l.title)}</h2><p>${esc(l.desc)}</p></a>`
  ).join("\n    ");
  const body = `<div class="wrap">
<header class="top">
  <div>
    <p class="eyebrow">Retirement Map</p>
    <h1>Retirement Map</h1>
    <p class="lede">A free Monte Carlo retirement planner that runs entirely in your browser. Pick the household closest to yours, or open one and type your own numbers over it.</p>
  </div>
</header>
<section class="picture" aria-label="Choose a household">
  <div class="links-grid">
    ${links}
  </div>
</section>
<footer>
  <p><b>Example numbers.</b> The households are illustrations built from reasonable assumptions, not anyone's real accounts. Type your own figures on any page; they stay in that browser only.</p>
  <p><b>Not advice.</b> This is an educational tool. It is not financial, tax or legal advice, and tax rules change often.</p>
</footer>
</div>
`;
  const out = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="${csp}">
${head.trim()}
</head>
<body>
${body.trim()}
</body>
</html>
`;
  writeFileSync(new URL("./all.html", import.meta.url), out);
  console.log(`wrote all.html (${(out.length / 1024).toFixed(0)} KB)`);
}
