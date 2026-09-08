import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";

const [portArg, rootArg = ".", baseArg = "/"] = process.argv.slice(2);
const port = Number(portArg);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`Invalid port: ${portArg}`);

function normalizeBasePath(value) {
  const trimmed = String(value || "/").trim();
  if (!trimmed || trimmed === "/") return "/";
  const parts = trimmed.split("/").filter(Boolean);
  if (!parts.length || parts.some(part => part === "." || part === ".." || part.includes("\\"))) {
    throw new Error(`Invalid base path: ${value}`);
  }
  return `/${parts.join("/")}/`;
}

const root = await realpath(path.resolve(rootArg));
const basePath = normalizeBasePath(baseArg);
const inside = (parent, child) => child === parent || child.startsWith(parent + path.sep);
const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".mp3", "audio/mpeg"]
]);

function send(res, status, body = "Not Found\n", headers = {}) {
  res.writeHead(status, { "cache-control": "no-store", ...headers });
  res.end(body);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method Not Allowed\n");
    const url = new URL(req.url || "/", "http://127.0.0.1");
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { return send(res, 400, "Bad Request\n"); }

    if (basePath !== "/" && pathname === basePath.slice(0, -1)) {
      res.writeHead(302, { location: basePath, "cache-control": "no-store" });
      return res.end();
    }
    if (!pathname.startsWith(basePath)) return send(res, 404);

    let relative = pathname.slice(basePath.length);
    if (!relative || relative.endsWith("/")) relative += "index.html";
    if (relative.includes("\0")) return send(res, 400, "Bad Request\n");

    const target = path.resolve(root, relative);
    if (!inside(root, target)) return send(res, 404);
    const canonical = await realpath(target).catch(() => null);
    if (!canonical || !inside(root, canonical)) return send(res, 404);
    const info = await stat(canonical).catch(() => null);
    if (!info?.isFile()) return send(res, 404);

    const body = await readFile(canonical);
    const headers = {
      "content-type": mime.get(path.extname(canonical).toLowerCase()) || "application/octet-stream",
      "content-length": String(body.length)
    };
    res.writeHead(200, { "cache-control": "no-store", ...headers });
    if (req.method === "HEAD") return res.end();
    res.end(body);
  } catch (error) {
    console.error(error);
    send(res, 500, "Internal Server Error\n");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}${basePath}`);
});
