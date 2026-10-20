// Author an actual portable GLB, not a preview-only deformation. Requires npm ci.
// Run: npm run character:build (the browser is supplied by the npm dependency).
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { browserOptions } from '../tests/browser.ts';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const server = await createServer({ server: { host: '127.0.0.1', port: 0, open: false } });
let browser;
try {
  await server.listen();
  const address = server.httpServer.address();
  browser = await chromium.launch(await browserOptions());
  const page = await browser.newPage();
  await page.route('**/__character_build', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html><body style="margin:0"></body></html>',
    }),
  );
  page.on('console', (message) => console.log(message.text()));
  // No preview/game is booted. Vite transforms the reusable authoring module.
  await page.goto(`http://localhost:${address.port}/__character_build`);
  const sourceHash = createHash('sha256')
    .update(await readFile('public/models/101172.glb'))
    .digest('hex');
  const result = await page.evaluate(async (sourceHash) => {
    const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
    const { GLTFExporter } =
      await import('/node_modules/three/examples/jsm/exporters/GLTFExporter.js');
    const { rig101172 } = await import('/src/character/rig101172.ts');
    const source = await new GLTFLoader().loadAsync('/models/101172.glb');
    const rig = rig101172(source.scene);
    rig.scene.userData.heaCharacter.sourceSHA256 = sourceHash;
    const binary = await new GLTFExporter().parseAsync(rig.scene, {
      binary: true,
      animations: rig.animations,
    });
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(new Blob([binary]));
    });
    return { data, bones: rig.skeleton.bones.length, clips: rig.animations.map((a) => a.name) };
  }, sourceHash);
  await mkdir('public/models', { recursive: true });
  const bytes = Buffer.from(result.data, 'base64');
  await writeFile('public/models/101172-rigged.glb', bytes);
  console.log(
    `Saved 101172-rigged.glb: ${bytes.length} bytes, ${result.bones} bones, clips: ${result.clips.join(', ')}`,
  );
} finally {
  await browser?.close();
  await server.close();
}
