/* SVG icon set — shared with the vision prototype (the design contract). */
const svg = (s: string) => <span dangerouslySetInnerHTML={{ __html: s }} style={{ display: "contents" }} />;
const s = (d: string, fill = false, size = 22) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;

const D = {
  home: "M4 10.5 12 4l8 6.5V20H4z",
  learn: "M2 8.5 12 4l10 4.5-10 4.5z M6 11v5c0 1.4 2.7 3 6 3s6-1.6 6-3v-5",
  trade: "M4 18V9M9 18V5M14 18v-6M19 18v-9",
  wisdom: "M12 3l2.4 5.4L20 11l-5.6 2.6L12 19l-2.4-5.4L4 11l5.6-2.6z",
  target: "M12 12m-9 0a9 9 0 1018 0 9 9 0 10-18 0 M12 12m-5 0a5 5 0 1010 0 5 5 0 10-10 0 M12 12m-1 0a1 1 0 102 0 1 1 0 10-2 0",
  ai: "M4 6h16v12H4z M9 12h.01M15 12h.01M12 3v3",
  back: "M15 5l-7 7 7 7",
  close: "M6 6l12 12M18 6L6 18",
  lock: "M5 11h14v10H5z M8 11V7a4 4 0 018 0v3",
  search: "M11 11m-7 0a7 7 0 1014 0 7 7 0 10-14 0 M20 20l-4-4",
  arrow: "M5 12h14M13 6l6 6-6 6",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18",
  plane: "M2 12l19-8-6 18-3-8z M12 14l9-10",
  gift: "M3 10h18v11H3z M3 10V7h18v3 M12 7v14 M12 7c-2-4-6-3-6 0h6zm0 0c2-4 6-3 6 0h-6z",
  car: "M4 15l1.5-5A2 2 0 017.4 8.5h9.2a2 2 0 011.9 1.5L20 15v4H4z M7 19v2M17 19v2 M7 14h.01M17 14h.01",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  book: "M4 4h7a3 3 0 013 3v13a2 2 0 00-2-2H4z M20 4h-7a3 3 0 00-3 3v13a2 2 0 012-2h8z",
  plus: "M12 5v14M5 12h14",
  scale: "M12 4v16M6 8h12M5 8l-3 6h6zM19 8l3 6h-6z",
  alert: "M12 4l9 16H3z M12 10v4M12 17.2v.2",
  cap: "M2 8.5L12 4l10 4.5-10 4.5z M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5",
  chart: "M4 19V9M10 19V4M16 19v-7M22 19H2",
  seed: "M12 12m-8.5 0a8.5 8.5 0 1017 0 8.5 8.5 0 10-17 0 M12 7v5l3.5 2",
  bell: "M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6 M10 21h4",
  sun: "M12 12m-4 0a4 4 0 108 0 4 4 0 10-8 0 M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  edit: "M4 20h4l10-10-4-4L4 16z M13 7l4 4",
};

export const I = {
  home: svg(s(D.home)), learn: svg(s(D.learn)), stack: svg(s(D.learn)), trade: svg(s(D.trade)), sim: svg(s(D.trade)),
  wisdom: svg(s(D.wisdom)), target: svg(s(D.target)), ai: svg(s(D.ai)), back: svg(s(D.back)), close: svg(s(D.close)),
  lock: svg(s(D.lock, false, 16)), search: svg(s(D.search)), az: svg(s(D.search)), arrow: svg(s(D.arrow)), spark: svg(s(D.spark)),
  plane: svg(s(D.plane)), gift: svg(s(D.gift)), car: svg(s(D.car)), shield: svg(s(D.shield)), book: svg(s(D.book)),
  plus: svg(s(D.plus)), scale: svg(s(D.scale)), alert: svg(s(D.alert)), cap: svg(s(D.cap)), chart: svg(s(D.chart)),
  seed: svg(s(D.seed, false, 34)), bell: svg(s(D.bell)), sun: svg(s(D.sun)), moon: svg(s(D.moon)), trash: svg(s(D.trash, false, 18)), edit: svg(s(D.edit, false, 18)),
  user: svg(s("M12 8.5a3.4 3.4 0 100-6.8 3.4 3.4 0 000 6.8z M5 20c0-3.7 3.1-5.6 7-5.6s7 1.9 7 5.6", true)),
  profile: svg(s("M12 8.5a3.4 3.4 0 100-6.8 3.4 3.4 0 000 6.8z M5 20c0-3.7 3.1-5.6 7-5.6s7 1.9 7 5.6", true)),
  play: svg(s("M8 5v14l11-7z", true, 15)),
  check: svg('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>'),
  bolt: svg(s("M13 3L4 14h6l-1 7 9-11h-6z", true)),
  flame: svg('<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3-1 4-2 6s-1 4 2 4c2 0 3-2 2-4 3 2 4 5 2 8-1.6 2.4-5 3-7.6 1.6C6 16.6 5 13 7 10c1.4-2 3-3 5-8z"/></svg>'),
  star: svg('<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/></svg>'),
};
export type IconName = keyof typeof I;
