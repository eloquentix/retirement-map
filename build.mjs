// Builds standalone pages from src/retirement-map.html.
//   node build.mjs
// all.html shows all example households; each of the others opens on one household only, so it
// can be sent on its own (email attachment or a public link). Deployed via ./deploy.sh.
// Every page carries a Content-Security-Policy: no network access, and no script except its own (allowed by hash).
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const SRC = new URL("./src/retirement-map.html", import.meta.url);
const src = readFileSync(SRC, "utf8");

const pages = [
  { file: "all.html", only: null, title: "Retirement Map" },
  { file: "homes.html", only: "twohomes", title: "One Salary, Two Homes" },
  { file: "artist.html", only: "royalties", title: "Living on Royalties" },
  { file: "angels.html", only: "angel", title: "Angel Investor Map" },
  { file: "indie.html", only: "indie", title: "Independent Developer" },
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
