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
    const { CharacterLocomotion } = await import('/src/character/CharacterLocomotion.ts');
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
    player.setMode('bind', true);
    const gait = new CharacterLocomotion(gltf.scene);
    window.reviewMotion = (pace, x, forward, angle) => {
      gait.reset();
      player.setMode('bind', true);
      for (let i = 0; i < 100; i++) {
        player.update(1/120);
        gait.apply(1/120, {pace, x, forward, airborne:false, turnRate:0});
      }
      camera.position.set(Math.sin(angle)*5, 1.1, Math.cos(angle)*5);
      camera.lookAt(0, 1.1, 0);
      label.textContent = `pace ${pace} · direction ${x}/${forward}`;
      renderer.render(scene, camera);
    };
  });
  await mkdir('.cache/motion-review', {recursive:true});
  for (const [name, pace, x, z] of [['run',1,0,4],['sprint',2,0,6],['strafe',1,3,0],['back',1,0,-3]])
    for (const [view, angle] of [['front',0],['side',Math.PI/2]]) {
      await page.evaluate(([pace,x,z,angle]) => window.reviewMotion(pace,x,z,angle), [pace,x,z,angle]);
      await page.screenshot({path:`.cache/motion-review/${name}-${view}.png`});
    }
} finally {
  await browser?.close();
  await server.close();
}
