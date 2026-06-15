import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('prepara massa visual Playwright', async () => {
  execFileSync(process.execPath, [path.join(__dirname, 'global.setup.cjs')], {
    cwd: path.resolve(__dirname, '..', '..'),
    stdio: 'inherit',
  });
});
