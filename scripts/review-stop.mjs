// Independent renderer for Starting / phase-specific Stopping clips. Images stay ignored.
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { browserOptions } from '../tests/browser.ts';
import { mkdir } from 'node:fs/promises';
const server = await createServer({ server: { host: '127.0.0.1', port: 0 } });
let browser;
try {
  await server.listen();
  browser = await chromium.launch(await browserOptions());
  const page = await browser.newPage({ viewport: { width: 640, height: 760 } });
  await page.route('**/__stop_review', (r) =>
    r.fulfill({ contentType: 'text/html', body: '<body style="margin:0"></body>' }),
  );
  await page.goto(`http://localhost:${server.httpServer.address().port}/__stop_review`);
  await page.evaluate(async () => {
    const T = await import('/node_modules/three/build/three.module.js');
    const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
    const { CharacterPlayback } = await import('/src/character/CharacterPlayback.ts');
    const gltf = await new GLTFLoader().loadAsync('/models/101172-rigged.glb');
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    player.rootMotionEnabled = true;
    const scene = new T.Scene();
    scene.background = new T.Color('#c5cecb');
    scene.add(gltf.scene);
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
    window.beginStop = (phase) => {
      player.setMode('walk', true);
      gltf.scene.position.set(0, 0, 0);
      player.playing = true;
      player.speed = 1;
      player.seek(phase);
      player.setMode('bind');
      time = 0;
      const p = player.stopPlan;
      return {
        lead: p.lead,
        times: [
          0,
          p.firstContact,
          (p.followStart + p.secondContact) / 2,
          p.secondContact,
          p.clip.duration,
        ],
      };
    };
    window.beginStart = () => {
      player.setMode('bind', true);
      gltf.scene.position.set(0, 0, 0);
      player.playing = true;
      player.speed = 1;
      player.setMode('walk');
      time = 0;
      const p = player.startPlan;
      return {
        times: [
          0,
          0.09,
          p.clip.duration * 0.4,
          p.clip.duration * 0.7,
          p.clip.duration,
          p.clip.duration + 0.12,
          p.clip.duration + 0.35,
        ],
      };
    };
    window.renderStop = (t, angle, caption) => {
      if (t < time) throw new Error('Review time must be ascending');
      const starting = player.isStarting;
      player.update(t - time);
      gltf.scene.position.add(player.consumeRootMotion());
      if (!starting && player.mode === 'walk')
        gltf.scene.position.z += (t - time) * player.speed * player.authoredWalkSpeed;
      time = t;
      camera.position.set(Math.sin(angle) * 5, 1.1, Math.cos(angle) * 5 + 0.2);
      camera.lookAt(0, 1.1, 0.2);
      label.textContent = caption;
      renderer.render(scene, camera);
    };
  });
  await mkdir('.cache/stop-review', { recursive: true });
  for (const phase of [0.25, 0.75])
    for (const [view, angle] of [
      ['front', 0],
      ['side', Math.PI / 2],
      ['three-quarter', Math.PI / 6],
    ]) {
      const plan = await page.evaluate((p) => window.beginStop(p), phase);
      for (let i = 0; i < plan.times.length; i++) {
        await page.evaluate(({ t, angle, caption }) => window.renderStop(t, angle, caption), {
          t: plan.times[i],
          angle,
          caption: `Stop · phase ${phase} · lead ${plan.lead} · stage ${i}`,
        });
        await page.screenshot({ path: `.cache/stop-review/${phase}-${view}-${i}.png` });
      }
    }
  for (const [view, angle] of [
    ['front', 0],
    ['side', Math.PI / 2],
    ['three-quarter', Math.PI / 6],
  ]) {
    const plan = await page.evaluate(() => window.beginStart());
    for (let i = 0; i < plan.times.length; i++) {
      await page.evaluate(({ t, angle, caption }) => window.renderStop(t, angle, caption), {
        t: plan.times[i],
        angle,
        caption: `Start → Walking · ${view} · stage ${i}`,
      });
      await page.screenshot({ path: `.cache/stop-review/start-${view}-${i}.png` });
    }
  }
  console.log('Stop renders: .cache/stop-review/');
} finally {
  await browser?.close();
  await server.close();
}
