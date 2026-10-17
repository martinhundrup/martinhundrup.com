import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative, join } from 'node:path';
import config from '../cloudflare.config.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, '.cloudflare/output/v0');
// Verify the exact resolved target before replacing generated output.
if (relative(root, output) !== join('.cloudflare', 'output', 'v0')) throw new Error('Unexpected Cloudflare output directory');
await rm(output, { recursive: true, force: true });
const workerDirectory = resolve(output, 'workers/default');
await mkdir(workerDirectory, { recursive: true });
await cp(new URL('../dist/', import.meta.url), resolve(workerDirectory, 'assets'), { recursive: true });
await writeFile(resolve(output, 'config.json'), JSON.stringify({ accountId: config.accountId, buildContext: { isPreview: false } }, null, 2));
await writeFile(resolve(workerDirectory, 'worker.config.json'), JSON.stringify(config.worker, null, 2));
console.log(`Prepared assets-only Worker ${config.worker.name} for martinhundrup.com`);
