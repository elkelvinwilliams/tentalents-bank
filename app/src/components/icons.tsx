/* SVG icons ported verbatim from the prototype. */
/* eslint-disable react/no-danger */
const svg = (s: string) => <span dangerouslySetInnerHTML={{ __html: s }} style={{ display: "contents" }} />;

export const I = {
  book: svg('<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 4.5h6a3 3 0 013 3v12a2.5 2.5 0 00-2.5-2.5H3zM21 4.5h-6a3 3 0 00-3 3v12a2.5 2.5 0 012.5-2.5H21z"/></svg>'),
  shield: svg('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/></svg>'),
  alert: svg('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.2v.2"/></svg>'),
  cap: svg('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8.5L12 4l10 4.5-10 4.5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/></svg>'),
  scale: svg('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 4v16M6 8h12M5 8l-3 6h6zM19 8l3 6h-6z"/></svg>'),
  chart: svg('<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 19V9M10 19V4M16 19v-7M22 19H2"/></svg>'),
  check: svg('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2"><path d="M4 12.5l5 5L20 6.5"/></svg>'),
  lock: svg('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>'),
  back: svg('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 5l-7 7 7 7"/></svg>'),
  close: svg('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg>'),
  home: svg('<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 10.5L12 4l8 6.5V20H4z"/></svg>'),
  stack: svg('<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7h16M4 12h16M4 17h10"/></svg>'),
  az: svg('<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>'),
  sim: svg('<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 16l5-6 4 4 5-7 4 5"/></svg>'),
  user: svg('<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8.5" r="3.7"/><path d="M4.5 20c0-4 3.4-6 7.5-6s7.5 2 7.5 6"/></svg>'),
  seed: svg('<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/></svg>'),
};
