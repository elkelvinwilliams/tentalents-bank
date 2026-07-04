import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FakeIntersectionObserver,
  loadMain,
  mockRafAdvancingByDuration,
  setMatchMedia,
  triggerIntersection,
} from './helpers.js';

function setFixture(html) {
  document.body.innerHTML = html;
}

const baseFixture = `
  <div class="site-header"></div>
  <div class="scroll-progress"></div>
  <button class="nav-toggle" aria-expanded="false"></button>
  <div class="mobile-menu"><a href="#home">Home</a><a href="#about">About</a></div>
  <div class="reveal" id="reveal1"></div>
  <span id="counter1" data-count="14.6" data-decimals="1" data-prefix="£" data-suffix="bn"></span>
  <form data-demo novalidate>
    <input id="email" name="email" type="email" required />
    <button type="submit">Submit enquiry</button>
    <p class="form-success" hidden>Thank you</p>
  </form>
  <span id="year"></span>
`;

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  window.IntersectionObserver = FakeIntersectionObserver;
  setMatchMedia();
  setFixture(baseFixture);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('header scroll state', () => {
  it('marks the header scrolled and updates the progress bar past the threshold', async () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 500 });
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });

    await loadMain();
    const header = document.querySelector('.site-header');
    const progress = document.querySelector('.scroll-progress');

    expect(header.classList.contains('scrolled')).toBe(false);

    window.scrollY = 250;
    window.dispatchEvent(new Event('scroll'));

    expect(header.classList.contains('scrolled')).toBe(true);
    expect(progress.style.width).toBe('50%');
  });
});

describe('mobile nav toggle', () => {
  it('toggles nav-open and aria-expanded on click', async () => {
    await loadMain();
    const toggle = document.querySelector('.nav-toggle');

    toggle.click();
    expect(document.body.classList.contains('nav-open')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    toggle.click();
    expect(document.body.classList.contains('nav-open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the menu when a mobile menu link is clicked', async () => {
    await loadMain();
    const toggle = document.querySelector('.nav-toggle');
    toggle.click();

    document.querySelector('.mobile-menu a').click();

    expect(document.body.classList.contains('nav-open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the menu on Escape', async () => {
    await loadMain();
    const toggle = document.querySelector('.nav-toggle');
    toggle.click();
    expect(document.body.classList.contains('nav-open')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(document.body.classList.contains('nav-open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('scroll reveal', () => {
  it('adds in-view immediately when reduced motion is preferred', async () => {
    setMatchMedia({ '(prefers-reduced-motion: reduce)': true });
    await loadMain();
    expect(document.getElementById('reveal1').classList.contains('in-view')).toBe(true);
  });

  it('adds in-view immediately when IntersectionObserver is unsupported', async () => {
    delete window.IntersectionObserver;
    setFixture(baseFixture.replace(/<span id="counter1".*?<\/span>\s*/s, ''));
    await loadMain();
    expect(document.getElementById('reveal1').classList.contains('in-view')).toBe(true);
  });

  it('waits for intersection before adding in-view otherwise', async () => {
    await loadMain();
    const el = document.getElementById('reveal1');
    expect(el.classList.contains('in-view')).toBe(false);
    triggerIntersection(el);
    expect(el.classList.contains('in-view')).toBe(true);
  });
});

describe('animated counters', () => {
  it('renders the final formatted value immediately when reduced motion is preferred', async () => {
    setMatchMedia({ '(prefers-reduced-motion: reduce)': true });
    await loadMain();
    const el = document.getElementById('counter1');
    triggerIntersection(el);
    expect(el.textContent).toBe('£14.6bn');
  });

  it('animates to the final formatted value via requestAnimationFrame', async () => {
    mockRafAdvancingByDuration(1600);
    await loadMain();
    const el = document.getElementById('counter1');
    triggerIntersection(el);
    expect(el.textContent).toBe('£14.6bn');
  });

  it('renders every counter immediately when IntersectionObserver is unsupported', async () => {
    delete window.IntersectionObserver;
    setFixture(baseFixture.replace('<div class="reveal" id="reveal1"></div>', ''));
    await loadMain();
    expect(document.getElementById('counter1').textContent).toBe('£14.6bn');
  });
});

describe('demo form submission', () => {
  it('shows a sending state then success once valid data is submitted', async () => {
    vi.useFakeTimers();
    await loadMain();
    const form = document.querySelector('form[data-demo]');
    const btn = form.querySelector('[type="submit"]');
    document.getElementById('email').value = 'jane@example.com';

    btn.click();

    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toBe('Sending…');

    vi.advanceTimersByTime(900);

    expect(form.querySelector('.form-success').hidden).toBe(false);
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toBe('Submit enquiry');
  });

  it('blocks submission and reports validity when a required field is empty', async () => {
    await loadMain();
    const form = document.querySelector('form[data-demo]');
    const btn = form.querySelector('[type="submit"]');
    const reportValiditySpy = vi.spyOn(form, 'reportValidity');

    btn.click();

    expect(reportValiditySpy).toHaveBeenCalled();
    expect(btn.disabled).toBe(false);
    expect(form.querySelector('.form-success').hidden).toBe(true);
  });
});

describe('footer year', () => {
  it('fills in the current year', async () => {
    await loadMain();
    expect(document.getElementById('year').textContent).toBe(String(new Date().getFullYear()));
  });
});
