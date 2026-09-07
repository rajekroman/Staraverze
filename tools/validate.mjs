import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const fail = message => {
  console.error(`CHYBA: ${message}`);
  process.exitCode = 1;
};

const html = read("index.html");
const game = read("game.js");
const sw = read("sw.js");
const manifest = JSON.parse(read("manifest.webmanifest"));
const version = read("VERSION.txt").trim();
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) fail(`Duplicitní HTML ID: ${[...new Set(duplicates)].join(", ")}`);

for (const match of game.matchAll(/\$\("([^"]+)"\)/g)) {
  if (!ids.includes(match[1])) fail(`game.js odkazuje na chybějící HTML ID #${match[1]}`);
}

for (const name of ["drawPatrol", "drawItem", "drawHotspot"]) {
  const count = [...game.matchAll(new RegExp(`function ${name}\\(`, "g"))].length;
  if (count !== 1) fail(`${name} musí mít právě jednu definici, nalezeno ${count}`);
}

const localPaths = new Set();
for (const source of [html, game, sw]) {
  for (const match of source.matchAll(/["'`](\.\/[A-Za-z0-9_./-]+)["'`]/g)) localPaths.add(match[1]);
}
for (const icon of manifest.icons ?? []) localPaths.add(`./${icon.src.replace(/^\.\//, "")}`);
for (const path of localPaths) {
  if (path === "./") continue;
  if (!fs.existsSync(path.slice(2))) fail(`Chybějící lokální soubor ${path}`);
}

for (const path of ["./", "./index.html", "./style.css", "./game.js", "./manifest.webmanifest"]) {
  if (!sw.includes(`"${path}"`)) fail(`Service worker neobsahuje ${path}`);
}

if (version !== "5.4.2") fail(`VERSION.txt uvádí ${version || "prázdnou hodnotu"} místo 5.4.2`);
if (!html.includes(`v${version}`)) fail(`Titulní obrazovka neuvádí v${version}`);
if (!game.includes(`const APP_VERSION = "${version}"`)) fail(`Runtime neuvádí APP_VERSION ${version}`);
if (manifest.name !== `Lovec vltavínů: Na zelené vlně v${version}`) fail(`Manifest neuvádí v${version}`);
if (!sw.includes(`lovec-vltavinu-reborn-v${version.replaceAll(".", "-")}`)) fail(`Cache není povýšena na v${version}`);

if (!process.exitCode) console.log(`Validace OK: ${ids.length} HTML ID, ${localPaths.size} lokálních odkazů, renderer v5.4.2.`);
