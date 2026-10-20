// Visual QA of the exported GLB, independent of the preview. PNGs remain ignored.
// npm run character:review [-- public/models/101172-rigged.glb]
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { browserOptions } from '../tests/browser.ts';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';

const asset = process.argv[2] || 'public/models/101172-rigged.glb';
const url = asset.startsWith('public/') ? '/' + asset.slice(7) : '/' + asset;
const destination = `.cache/character-review/${basename(asset, '.glb')}`;
const server = await createServer({ server: { host: '127.0.0.1', port: 0 } });
let browser;
try {
  await server.listen();
  const address = server.httpServer.address();
  browser = await chromium.launch(await browserOptions());
  const page = await browser.newPage({
    viewport: { width: 640, height: 760 },
    deviceScaleFactor: 1,
  });
  await page.route('**/__review', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html><body style="margin:0"></body></html>',
    }),
  );
  await page.goto(`http://localhost:${address.port}/__review`);
  const metrics = await page.evaluate(async (url) => {
    const T = await import('/node_modules/three/build/three.module.js');
    const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
    const gltf = await new GLTFLoader().loadAsync(url);
    const model = gltf.scene;
    const hasWalk = gltf.animations.some((a) => a.name === 'Walking');
    if (!hasWalk) {
      const bounds = new T.Box3().setFromObject(model);
      const centre = bounds.getCenter(new T.Vector3());
      const scale = 2 / (bounds.max.y - bounds.min.y);
      model.scale.multiplyScalar(scale);
      model.position.set(-centre.x * scale, -bounds.min.y * scale, -centre.z * scale);
    }
    const label = document.createElement('div');
    label.style.cssText =
      'position:absolute;top:10px;left:12px;color:#15251b;font:12px monospace;white-space:pre';
    document.body.append(label);
    const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(640, 760);
    renderer.toneMapping = T.ACESFilmicToneMapping;
    document.body.append(renderer.domElement);
    const scene = new T.Scene();
    scene.background = new T.Color('#c5cecb');
    scene.add(model);
    scene.add(new T.HemisphereLight('#ffffff', '#777777', 2.2));
    const light = new T.DirectionalLight('#ffffff', 3);
    light.position.set(3, 5, 4);
    scene.add(light);
    const floor = new T.GridHelper(10, 40, '#88938e', '#a6b0ab');
    floor.position.y = -0.008;
    scene.add(floor);
    scene.add(
      new T.ArrowHelper(
        new T.Vector3(0, 0, 1),
        new T.Vector3(0.38, 0.015, -0.2),
        0.8,
        '#327b65',
        0.1,
        0.05,
      ),
    );
    const camera = new T.OrthographicCamera(-0.96, 0.96, 1.14, -1.14, 0.1, 100);
    const mixer = new T.AnimationMixer(model);
    const clip = gltf.animations.find((a) => a.name === 'Walking');
    const action = clip ? mixer.clipAction(clip).play() : undefined;
    function sample(phase) {
      if (action) action.time = phase * clip.duration;
      mixer.update(0);
      scene.updateMatrixWorld(true);
    }
    const positions = (name) => model.getObjectByName(name).getWorldPosition(new T.Vector3());
    const stance = model.getObjectByName('HEA_101172')?.userData.heaCharacter.walkStance ?? 0.62;
    const data = {
      stanceKneeMin: 180,
      stanceKneeMax: 0,
      swingKneeMax: 0,
      ankleSeparationMin: Infinity,
      hipHeightMin: Infinity,
      hipHeightMax: -Infinity,
    };
    for (let frame = 0; frame < (hasWalk ? 120 : 0); frame++) {
      const phase = frame / 120;
      sample(phase);
      const y = positions('Hips').y;
      data.hipHeightMin = Math.min(data.hipHeightMin, y);
      data.hipHeightMax = Math.max(data.hipHeightMax, y);
      data.ankleSeparationMin = Math.min(
        data.ankleSeparationMin,
        positions('LeftFoot').x - positions('RightFoot').x,
      );
      for (const [side, offset] of [
        ['Left', 0],
        ['Right', 0.5],
      ]) {
        const a = positions(side + 'Thigh'),
          b = positions(side + 'Shin'),
          c = positions(side + 'Foot');
        const flex = T.MathUtils.radToDeg(Math.PI - a.sub(b).angleTo(c.sub(b)));
        if ((phase + offset) % 1 < stance) {
          data.stanceKneeMin = Math.min(data.stanceKneeMin, flex);
          data.stanceKneeMax = Math.max(data.stanceKneeMax, flex);
        } else data.swingKneeMax = Math.max(data.swingKneeMax, flex);
      }
    }
    window.review = (phase, angle) => {
      sample(phase);
      camera.position.set(Math.sin(angle) * 5, 1.13, Math.cos(angle) * 5);
      camera.lookAt(0, 1.13, 0);
      label.textContent = `${hasWalk ? 'Walking export' : 'Original source / bind pose'} · ${Math.round(phase * 100)}%\nArrow = +Z / intended forward`;
      renderer.render(scene, camera);
    };
    return hasWalk ? { ...data, hasWalk } : { hasWalk };
  }, url);
  if ((await page.locator('canvas').count()) !== 1)
    throw new Error('Review must render only the character, not boot the game.');
  await mkdir(destination, { recursive: true });
  await writeFile(`${destination}/metrics.json`, JSON.stringify(metrics, null, 2));
  for (const [view, angle] of [
    ['front', 0],
    ['side', Math.PI / 2],
    ['three-quarter', Math.PI / 6],
  ]) {
    for (let frame = 0; frame < (metrics.hasWalk ? 8 : 1); frame++) {
      await page.evaluate(({ phase, angle }) => window.review(phase, angle), {
        phase: frame / 8,
        angle,
      });
      await page.screenshot({ path: `${destination}/${view}-${frame}.png` });
    }
  }
  console.log(destination, metrics);
} finally {
  await browser?.close();
  await server.close();
}
