// Reference sprint cycle renderer: settled full cycle, three views. Images stay ignored.
// Optional `before` needs the saved baseline at CharacterLocomotionBeforeReview.ts;
// remove that temporary source after review. See docs/SPRINT_REFERENCE.md.
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { browserOptions } from '../tests/browser.ts';
import { mkdir } from 'node:fs/promises';
const server = await createServer({ server: { host: '127.0.0.1', port: 0 } });
const revision = process.argv[2] || 'after';
const gaitModule =
  revision === 'before'
    ? '/src/character/CharacterLocomotionBeforeReview.ts'
    : '/src/character/CharacterLocomotion.ts';
const destination = `.cache/sprint-review/${revision}`;
let browser;
try {
  await server.listen();
  browser = await chromium.launch(await browserOptions());
  const page = await browser.newPage({ viewport: { width: 640, height: 760 } });
  await page.route('**/__stop_review', (r) =>
    r.fulfill({ contentType: 'text/html', body: '<body style="margin:0"></body>' }),
  );
  await page.goto(`http://localhost:${server.httpServer.address().port}/__stop_review`);
  await page.evaluate(async (gaitModule) => {
    const T = await import('/node_modules/three/build/three.module.js');
    const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
    const { CharacterPlayback } = await import('/src/character/CharacterPlayback.ts');
    const { CharacterArmSpace } = await import('/src/character/CharacterArmSpace.ts');
    const { CharacterLocomotion } = await import(gaitModule);
    const gltf = await new GLTFLoader().loadAsync('/models/101172-rigged.glb');
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    player.rootMotionEnabled = true;
    const scene = new T.Scene();
    scene.background = new T.Color('#c5cecb');
    const holder = new T.Group();
    holder.add(gltf.scene);
    scene.add(holder);
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
    const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(640, 760);
    renderer.toneMapping = T.ACESFilmicToneMapping;
    document.body.append(renderer.domElement);
    const label = document.createElement('div');
    label.style.cssText = 'position:absolute;top:10px;left:12px;color:#15251b;font:12px monospace';
    document.body.append(label);
    let time = 0;
    player.setMode('bind', true);
    const gait = new CharacterLocomotion(gltf.scene);
    const arms = new CharacterArmSpace(gltf.scene);
    window.reviewMotion = (pace, x, forward, angle, turnRate = 0, seconds = 0.8) => {
      gait.reset();
      holder.quaternion.identity();
      player.setMode('bind', true);
      for (let i = 0; i < Math.ceil(seconds * 120); i++) {
        player.update(1 / 120);
        const t = i / 120;
        const rate =
          turnRate === 99
            ? t < 0.6
              ? 4.5
              : t < 0.85
                ? 0
                : t < 1.45
                  ? -4.5
                  : t < 1.7
                    ? 0
                    : 4.5
            : turnRate;
        holder.rotation.y += rate / 120;
        gait.apply(1 / 120, { pace, x, forward, airborne: false, turnRate: rate });
        arms.apply();
      }
      camera.position.set(Math.sin(angle) * 5, 1.1, Math.cos(angle) * 5);
      camera.lookAt(0, 1.1, 0);
      label.textContent = `pace ${pace} · direction ${x}/${forward}`;
      renderer.render(scene, camera);
    };
  }, gaitModule);
  await mkdir(destination, { recursive: true });
  for (const [view, angle] of [
    ['side', Math.PI / 2],
    ['front', 0],
    ['oblique', 0.8],
  ]) {
    for (let frame = 0; frame < 12; frame++) {
      await page.evaluate(
        ([angle, seconds]) => window.reviewMotion(2, 0, 4.4, angle, 0, seconds),
        [angle, 3 + (frame * 0.734) / 12],
      );
      await page.screenshot({
        path: `${destination}/${view}-${String(frame).padStart(2, '0')}.png`,
      });
    }
  }
} finally {
  await browser?.close();
  await server.close();
}
