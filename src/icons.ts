const svg = (body: string, viewBox = '0 0 24 24') =>
  `<svg viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const icons = {
  arrow: svg('<path d="M4 12h15M13 6l6 6-6 6"/>'),
  play: svg('<path d="m9 5 11 7-11 7V5Z"/>'),
  close: svg('<path d="m6 6 12 12M18 6 6 18"/>'),
  pause: svg('<path d="M8 5v14M16 5v14" stroke-width="3"/>'),
  volume: svg('<path d="m11 4-6 5H2v6h3l6 5V4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'),
  mute: svg('<path d="m11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6"/>'),
  settings: svg(
    '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="#172020"/><circle cx="15" cy="17" r="3" fill="#172020"/>',
  ),
  fullscreen: svg('<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>'),
  flame: svg(
    '<path d="M12 2c2 5-1 6 1 9 1-1 2-3 2-5 4 4 6 7 4 11-2 5-9 6-13 1-3-4-1-8 2-11 0 4 2 5 3 5-2-4 1-7 1-10Z"/><path d="M12 14c-4 4-2 7 1 7 3-1 4-4 1-6 0 2-2 3-2-1Z"/>',
  ),
  prism: svg('<path d="m12 2 8 10-8 10L4 12 12 2Zm0 0v20M4 12h16"/>'),
  nova: svg(
    '<circle cx="12" cy="12" r="5"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4M4 4l3 3m10 10 3 3M4 20l3-3M17 7l3-3"/>',
  ),
  dash: svg('<path d="m10 5 7 7-7 7m-7-2h5M1 12h6M3 7h5"/>'),
  shield: svg('<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Z"/><path d="m8 12 3 3 5-6"/>'),
  jump: svg('<path d="m6 12 6-7 6 7m-6-7v14M5 2h14"/>'),
  target: svg(
    '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',
  ),
  reset: svg('<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/>'),
  help: svg('<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v.01"/>'),
  mouse: svg('<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 2v7M6 9h12"/>'),
  chevron: svg('<path d="m8 4 8 8-8 8"/>'),
};
