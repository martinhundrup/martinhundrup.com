import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL(process.argv.includes('--dist') ? '../dist/' : '../', import.meta.url));
const portArgument = process.argv.indexOf('--port');
const port = Number(portArgument >= 0 ? process.argv[portArgument + 1] : process.env.PORT || 3001);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' };
const allowed = new Set(['index.html', 'styles.css', 'app.js', 'projects.js', 'physics.js', 'playground.js', 'carousel.js', 'gif-player.js']);
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    // Bonsai is independently hosted. Keep its real path in the page, and
    // send local preview visitors to the live app until root deployment.
    if (pathname === '/bonsai' || pathname.startsWith('/bonsai/')) { response.writeHead(302, { Location: `https://martinhundrup.com${pathname}` }).end(); return; }
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const path = resolve(root, relative);
    const assetRoot = resolve(root, 'assets') + sep;
    const isPublicFile = allowed.has(relative) || (relative.startsWith('assets/') && path.startsWith(assetRoot));
    if (!isPublicFile || !path.startsWith(root + (root.endsWith(sep) ? '' : sep))) { response.writeHead(404).end('Not found'); return; }
    if (!(await stat(path)).isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(await readFile(path));
  } catch { response.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Local: http://localhost:${port}`));
