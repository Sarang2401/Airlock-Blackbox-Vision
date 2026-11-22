import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

export function offlineShell(): Plugin {
  return {
    name: 'escrowhealth-offline-shell',
    apply: 'build',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const assets = [...new Set(['index.html', 'escrowhealth-mark.svg', ...Object.keys(bundle)])].sort();
        const worker = readFileSync(new URL('./offline-worker.js', import.meta.url), 'utf8');
        const mark = readFileSync(new URL('../public/escrowhealth-mark.svg', import.meta.url));
        const version = createHash('sha256').update(JSON.stringify(assets)).update(worker).update(mark).digest('hex').slice(0, 16);
        this.emitFile({
          type: 'asset',
          fileName: 'escrowhealth-offline.js',
          source: `const VERSION = ${JSON.stringify(version)};\nconst ASSETS = ${JSON.stringify(assets)};\n${worker}`,
        });
      },
    },
  };
}
