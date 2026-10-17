import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'projects.js', 'physics.js', 'playground.js', 'carousel.js', 'gif-player.js', 'assets']) await cp(new URL(file, root), new URL(file, output), { recursive: true });
console.log(`Static site ready: ${fileURLToPath(output)}`);
