import { vi } from 'vitest';

export class FakeIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observed = new Set();
    FakeIntersectionObserver.instances.push(this);
  }
  observe(el) {
    this.observed.add(el);
  }
  unobserve(el) {
    this.observed.delete(el);
  }
  disconnect() {
    this.observed.clear();
  }
}
FakeIntersectionObserver.instances = [];

export function triggerIntersection(el, isIntersecting = true) {
  const instance = FakeIntersectionObserver.instances.find((i) => i.observed.has(el));
  if (!instance) throw new Error('Element is not observed by any FakeIntersectionObserver');
  instance.callback([{ target: el, isIntersecting }], instance);
}

export function setMatchMedia(overrides = {}) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: overrides[query] ?? false,
    media: query,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

export function mockRafAdvancingByDuration(duration) {
  let ts = 0;
  window.requestAnimationFrame = vi.fn((cb) => {
    ts += duration;
    cb(ts);
    return 1;
  });
}

// main.js attaches some listeners directly to `document`/`window`, which persist
// across tests in the same file (jsdom's document/window aren't recreated per test).
// Track and strip those between loads so a previous test's stale handlers can't
// intercept events (e.g. Escape) meant for the current test's DOM.
let trackedGlobalListeners = [];

function cleanupTrackedGlobalListeners() {
  trackedGlobalListeners.forEach(([target, type, listener, options]) => {
    target.removeEventListener(type, listener, options);
  });
  trackedGlobalListeners = [];
}

let seq = 0;
export async function loadMain() {
  cleanupTrackedGlobalListeners();
  vi.resetModules();
  seq += 1;

  const originalDocAdd = document.addEventListener;
  const originalWinAdd = window.addEventListener;
  document.addEventListener = function (type, listener, options) {
    trackedGlobalListeners.push([document, type, listener, options]);
    return originalDocAdd.call(document, type, listener, options);
  };
  window.addEventListener = function (type, listener, options) {
    trackedGlobalListeners.push([window, type, listener, options]);
    return originalWinAdd.call(window, type, listener, options);
  };

  try {
    await import(/* @vite-ignore */ `../../assets/js/main.js?t=${seq}`);
  } finally {
    document.addEventListener = originalDocAdd;
    window.addEventListener = originalWinAdd;
  }
}
