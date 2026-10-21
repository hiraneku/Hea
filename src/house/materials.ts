import * as T from 'three';

// Hand-painted, deterministic local textures: no network images or asset CDN.
let seed = 128;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
function paint(size: number, draw: (c: CanvasRenderingContext2D, size: number) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const c = canvas.getContext('2d')!;
  draw(c, size);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.anisotropy = 4;
  return map;
}
const timber = paint(512, (c, s) => {
  c.fillStyle = '#ad794a';
  c.fillRect(0, 0, s, s);
  for (let i = 0; i < 1200; i++) {
    const x = random() * s,
      y = random() * s;
    c.strokeStyle = random() > 0.45 ? `rgba(72,37,18,${random() * 0.14})` : 'rgba(255,220,166,.12)';
    c.lineWidth = 0.5 + random() * 2;
    c.beginPath();
    c.moveTo(x, y);
    c.bezierCurveTo(x + 4, y + 30, x - 7, y + 70, x + 2, y + 150);
    c.stroke();
  }
});
const plaster = paint(256, (c, s) => {
  c.fillStyle = '#eadfc5';
  c.fillRect(0, 0, s, s);
  for (let i = 0; i < 12000; i++) {
    c.fillStyle = random() > 0.5 ? 'rgba(105,83,53,.04)' : 'rgba(255,255,255,.14)';
    c.fillRect(random() * s, random() * s, 2, 2);
  }
});
export const floorMap = paint(1024, (c, s) => {
  c.fillStyle = '#98714b';
  c.fillRect(0, 0, s, s);
  for (let row = 0; row < 12; row++)
    for (let col = -1; col < 4; col++) {
      const w = s / 3,
        h = s / 12,
        x = col * w + (row % 2) * w * 0.5,
        y = row * h;
      c.fillStyle = `hsl(31, ${25 + random() * 10}%, ${45 + random() * 9}%)`;
      c.fillRect(x + 1.5, y + 1.5, w - 3, h - 3);
      for (let grain = 0; grain < 45; grain++) {
        c.strokeStyle = random() > 0.4 ? 'rgba(70,36,16,.12)' : 'rgba(255,228,178,.15)';
        const gy = y + random() * h;
        c.beginPath();
        c.moveTo(x, gy);
        c.bezierCurveTo(x + w * 0.3, gy - 4, x + w * 0.7, gy + 3, x + w, gy);
        c.stroke();
      }
      c.fillStyle = 'rgba(61,38,22,.35)';
      for (const end of [x + 9, x + w - 10]) {
        c.fillRect(end, y + 9, 2, 2);
        c.fillRect(end, y + h - 11, 2, 2);
      }
    }
});
floorMap.repeat.set(3, 3);
export const rugMap = paint(512, (c, s) => {
  c.fillStyle = '#a7583d';
  c.fillRect(0, 0, s, s);
  c.strokeStyle = '#ddbd7c';
  c.lineWidth = 14;
  c.strokeRect(20, 20, s - 40, s - 40);
  c.lineWidth = 3;
  c.strokeRect(40, 40, s - 80, s - 80);
  for (let x = 80; x < 460; x += 65)
    for (let y = 80; y < 460; y += 65) {
      c.save();
      c.translate(x, y);
      c.rotate(Math.PI / 4);
      c.fillStyle = (x + y) % 2 ? '#d3a66a' : '#d5b881';
      c.fillRect(-9, -9, 18, 18);
      c.restore();
    }
  for (let i = 0; i < 30000; i++) {
    c.fillStyle = random() > 0.5 ? 'rgba(40,20,10,.05)' : 'rgba(255,245,210,.09)';
    c.fillRect(random() * s, random() * s, 1, 3);
  }
});
export const aoMap = paint(128, (c, s) => {
  const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(30,17,9,.30)');
  g.addColorStop(0.5, 'rgba(30,17,9,.12)');
  g.addColorStop(1, 'rgba(30,17,9,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, s, s);
});
export const artMap = paint(256, (c, s) => {
  c.fillStyle = '#c9d7c6';
  c.fillRect(0, 0, s, s);
  c.fillStyle = '#f5d9a0';
  c.beginPath();
  c.arc(174, 61, 26, 0, 7);
  c.fill();
  for (let i = 0; i < 3; i++) {
    c.fillStyle = ['#a8baa0', '#798e73', '#516b58'][i];
    c.beginPath();
    c.moveTo(0, s);
    for (let x = 0; x <= s; x += 8) c.lineTo(x, 130 + i * 26 + Math.sin(x / 50 + i * 3) * 26);
    c.lineTo(s, s);
    c.fill();
  }
  c.fillStyle = '#dcd1ab';
  c.fillRect(80, 166, 52, 40);
  c.fillStyle = '#744d36';
  c.beginPath();
  c.moveTo(72, 170);
  c.lineTo(106, 142);
  c.lineTo(141, 170);
  c.fill();
});
function mat(color: string, map?: T.Texture) {
  return new T.MeshStandardMaterial({ color, map, roughness: 0.89 });
}
export const M = {
  wood: mat('#cba675', timber),
  dark: mat('#74503b', timber),
  edge: mat('#9c704e', timber),
  oak: mat('#e3bb83', timber),
  floor: mat('#ffffff', floorMap),
  plaster: mat('#fff8e9', plaster),
  stone: mat('#aaa28d'),
  mortar: mat('#68665c'),
  linen: mat('#ece2c8'),
  sage: mat('#8f9e79'),
  rust: mat('#b87756'),
  blue: mat('#899eaa'),
  cream: mat('#f2dcae'),
  iron: mat('#44433a'),
  clay: mat('#b16d4c'),
  pottery: mat('#d2bb91'),
  leaf: mat('#587249'),
  leafLight: mat('#819353'),
  gold: mat('#b49a62'),
  bread: mat('#d2a561'),
  rug: mat('#ffffff', rugMap),
  art: mat('#ffffff', artMap),
  glow: new T.MeshStandardMaterial({
    color: '#ffb34b',
    emissive: '#ff7722',
    emissiveIntensity: 3,
    roughness: 1,
  }),
  glass: new T.MeshStandardMaterial({
    color: '#d4e9db',
    transparent: true,
    opacity: 0.1,
    roughness: 0.3,
    depthWrite: false,
  }),
  ao: new T.MeshBasicMaterial({
    map: aoMap,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  }),
};
