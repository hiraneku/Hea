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
  c.fillStyle = '#a28c70';
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
const plaster = paint(512, (c, s) => {
  c.fillStyle = '#cfc6aa';
  c.fillRect(0, 0, s, s);
  for (let i = 0; i < 140; i++) {
    const x = random() * s,
      y = random() * s,
      r = 15 + random() * 100;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, i % 3 ? 'rgba(92,77,46,.065)' : 'rgba(255,248,215,.12)');
    g.addColorStop(1, 'rgba(180,167,134,0)');
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 27000; i++) {
    c.fillStyle = i % 2 ? 'rgba(70,59,39,.055)' : 'rgba(255,250,224,.11)';
    c.fillRect(random() * s, random() * s, 1 + random() * 3, 1 + random() * 2);
  }
  for (let i = 0; i < 14; i++) {
    let x = random() * s,
      y = random() * s;
    c.strokeStyle = 'rgba(81,71,50,.12)';
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(x, y);
    for (let j = 0; j < 5; j++) {
      x += random() * 8 - 4;
      y += random() * 12;
      c.lineTo(x, y);
    }
    c.stroke();
  }
});
export const floorMap = paint(1024, (c, s) => {
  c.fillStyle = '#807b6d';
  c.fillRect(0, 0, s, s);
  const tile = s / 6;
  for (let row = 0; row < 6; row++)
    for (let col = -1; col < 7; col++) {
      const x = (col + (row % 2) * 0.5) * tile,
        y = row * tile;
      c.fillStyle = `hsl(${36 + random() * 7},${9 + random() * 9}%,${43 + random() * 12}%)`;
      c.beginPath();
      c.moveTo(x + 9, y + 3);
      c.lineTo(x + tile - 11, y + 5);
      c.lineTo(x + tile - 3, y + 15);
      c.lineTo(x + tile - 5, y + tile - 14);
      c.lineTo(x + tile - 15, y + tile - 4);
      c.lineTo(x + 10, y + tile - 5);
      c.lineTo(x + 4, y + tile - 16);
      c.lineTo(x + 3, y + 14);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(230,218,186,.18)';
      c.lineWidth = 1;
      c.stroke();
    }
  for (let i = 0; i < 70000; i++) {
    c.fillStyle = i % 2 ? 'rgba(35,32,24,.065)' : 'rgba(240,228,198,.08)';
    c.fillRect(random() * s, random() * s, 1 + random() * 3, 1);
  }
});
floorMap.repeat.set(2.2, 2.2);
const fabric = paint(256, (c, s) => {
  c.fillStyle = '#ded3b7';
  c.fillRect(0, 0, s, s);
  for (let i = 0; i < s; i += 2) {
    c.strokeStyle = i % 4 ? 'rgba(64,52,32,.08)' : 'rgba(255,255,235,.2)';
    c.beginPath();
    c.moveTo(i, 0);
    c.lineTo(i, s);
    c.moveTo(0, i);
    c.lineTo(s, i);
    c.stroke();
  }
});
export const rugMap = paint(512, (c, s) => {
  c.fillStyle = '#686146';
  c.fillRect(0, 0, s, s);
  c.strokeStyle = '#b3a073';
  c.lineWidth = 14;
  c.strokeRect(20, 20, s - 40, s - 40);
  c.lineWidth = 3;
  c.strokeRect(40, 40, s - 80, s - 80);
  for (let x = 80; x < 460; x += 65)
    for (let y = 80; y < 460; y += 65) {
      c.save();
      c.translate(x, y);
      c.rotate(Math.PI / 4);
      c.fillStyle = (x + y) % 2 ? '#b2a077' : '#9a895d';
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
  const bump = map?.clone();
  if (bump) bump.colorSpace = T.NoColorSpace;
  return new T.MeshStandardMaterial({
    color,
    map,
    roughness: map === fabric ? 0.96 : 0.92,
    bumpMap: bump,
    bumpScale: map === floorMap ? 0.035 : map === plaster ? 0.018 : 0.012,
  });
}
export const M = {
  wood: mat('#a78f68', timber),
  dark: mat('#7c6c59', timber),
  edge: mat('#9c704e', timber),
  oak: mat('#bca37a', timber),
  floor: mat('#ffffff', floorMap),
  plaster: mat('#eee6d0', plaster),
  stone: mat('#a49c83', plaster),
  roof: mat('#b8ad91', timber),
  stoneLight: mat('#b6ad91', plaster),
  stoneDark: mat('#8c8775', plaster),
  mortar: mat('#68665c'),
  linen: mat('#e1d9bf', fabric),
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

// Shallow physical relief; colour maps remain local, deterministic and reusable.
M.plaster.bumpMap = plaster;
M.plaster.bumpScale = 0.025;
M.floor.bumpMap = floorMap;
M.floor.bumpScale = 0.022;
M.linen.bumpMap = fabric;
M.linen.bumpScale = 0.009;
M.stone.bumpMap = plaster;
M.stone.bumpScale = 0.035;
