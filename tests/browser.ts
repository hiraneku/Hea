import chromium from '@sparticuz/chromium';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

/** The npm-distributed browser avoids a second browser download in restricted CI. */
export async function browserOptions() {
  if (process.env.BROWSER_EXECUTABLE_PATH)
    return {
      executablePath: process.env.BROWSER_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
    };
  if (process.platform !== 'linux') return {};
  const require = createRequire(import.meta.url);
  const root = resolve(require.resolve('@sparticuz/chromium'), '../../..');
  const libraries = resolve('.cache/chromium-libs');
  if (!existsSync(resolve(libraries, 'lib/libnspr4.so'))) {
    mkdirSync(libraries, { recursive: true });
    execFileSync('tar', ['xf', '-', '-C', libraries], {
      input: brotliDecompressSync(readFileSync(resolve(root, 'bin/al2023.tar.br'))),
    });
  }
  return {
    executablePath: await chromium.executablePath(),
    args: [
      ...chromium.args.filter((arg) => arg !== '--single-process'),
      '--enable-unsafe-swiftshader',
    ],
    env: {
      ...process.env,
      LD_LIBRARY_PATH: `${resolve(libraries, 'lib')}${process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : ''}`,
    } as Record<string, string>,
  };
}
