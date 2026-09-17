import { build } from 'esbuild';
import { mkdtemp, unlink, rmdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const folder = await mkdtemp(join(root, 'node_modules', '.interface-check-'));
const output = join(folder, 'check.mjs');
try {
  await build({
    entryPoints: [resolve(root, 'scripts/interface-checks.jsx')],
    outfile: output,
    platform: 'node', format: 'esm', bundle: true, packages: 'external',
    jsx: 'automatic', loader: { '.css': 'empty' },
    define: { 'import.meta.env.VITE_API_URL': '"http://localhost:8000"', 'process.env.NODE_ENV': '"production"' },
  });
  await import(pathToFileURL(output).href);
} finally {
  await unlink(output).catch(() => {});
  await rmdir(folder);
}
