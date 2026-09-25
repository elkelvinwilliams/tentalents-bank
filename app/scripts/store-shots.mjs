/* App Store / Play Store screenshots straight from the running app (real Inter/Manrope via next/font).
   6.7" iPhone: 430×932 @3 → 1290×2796. 6.9": 440×956 @3 → 1320×2868. Android phone: 412×915 @3 → 1236×2745. */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const B = process.env.SHOTS_BASE_URL || 'http://localhost:3000'; // SHOTS_BASE_URL=http://localhost:3000 node scripts/store-shots.mjs (needs playwright-core + chromium)
const SIZES = { '6.7': [430, 932], '6.9': [440, 956], 'android': [412, 915] };
fs.mkdirSync('store', { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function prep(ctx) {
  const p = await ctx.newPage();
  await p.addStyleTag?.catch?.(() => {});
  await p.goto(B, { waitUntil: 'networkidle' });
  await p.locator('label.consent').click(); await p.locator('button:has-text("Continue")').first().click({ force: true });
  await p.waitForSelector('#em'); await p.fill('#em', `store-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`); await p.fill('#pw', 'testpass123');
  await Promise.all([p.waitForNavigation(), p.locator('button:has-text("Create account")').first().click({ force: true })]);
  await p.waitForSelector('.opt');
  for (let i = 0; i < 10; i++) { await p.locator('.opt').nth(1).click({ force: true }); await p.waitForTimeout(80); }
  await p.waitForSelector('text=Your readiness profile'); await p.locator('button:has-text("Continue")').first().click({ force: true });
  await p.locator('button:has-text("Skip")').first().click({ force: true }); await p.waitForSelector('.tabbar'); await p.waitForTimeout(300);
  // name + some data so screens look lived-in
  await p.request.post(B + '/api/state', { data: { name: 'Naomi Adeyemi' } });
  await p.request.post(B + '/api/goals', { data: { name: 'Emergency fund', icon: 'shield', target: 6000, saved: 2150, targetMonth: '2027-06' } });
  await p.request.post(B + '/api/goals', { data: { name: 'First home', icon: 'home', target: 25000, saved: 8400, targetMonth: '2029-01' } });
  await p.request.post(B + '/api/build', { data: { kind: 'health', answers: { saving: 4, spending: 3, debt: 3, emergency: 2, knowledge: 3, investing: 2, goals: 4 } } });
  await p.request.post(B + '/api/build', { data: { kind: 'wealth', assets: { cash: 1450, savings: 8400, investments: 3100, property: 0, business: 0, other: 0 }, liabilities: { mortgage: 0, loans: 2100, credit: 600, other: 0 } } });
  await p.request.post(B + '/api/build', { data: { kind: 'talent', name: 'Spreadsheets', category: 'skill', level: 4 } });
  await p.request.post(B + '/api/lessons/t2-m1-l1/complete', { data: {} });
  await p.request.post(B + '/api/practise', { data: { action: 'order', symbol: 'XAUUSD', side: 'buy', type: 'market', qty: 2, stopLoss: 2300, takeProfit: 2500, reason: 'Planned: support bounce' } });
  await p.request.post(B + '/api/practise', { data: { action: 'order', symbol: 'AAPL', side: 'buy', type: 'market', qty: 20, reason: 'Long-term hold' } });
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForSelector('.tabbar'); await p.waitForTimeout(500);
  return p;
}
const hideDevBadge = (p) => p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });

for (const [name, [w, h]] of Object.entries(SIZES)) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const p = await prep(ctx); await hideDevBadge(p);
  const shot = (n) => p.screenshot({ path: `store/${name}-${n}.png` });
  const tab = (t) => p.locator(`.tab:has-text("${t}")`).first().click({ force: true });
  await p.waitForTimeout(400); await shot('1-home');
  await tab('Learn'); await p.waitForTimeout(500); await shot('2-learn');
  await tab('Practise'); await p.waitForSelector('.mrow', { timeout: 20000 }); await p.waitForTimeout(600); await shot('3-practise');
  await p.locator('.mrow:has-text("Gold")').first().click({ force: true }); await p.waitForSelector('.chart canvas', { timeout: 15000 }); await p.waitForTimeout(700); await shot('4-chart');
  await p.locator('.sheet .iconbtn').first().click({ force: true }); await p.waitForTimeout(200);
  await tab('Build'); await p.waitForTimeout(400); await p.locator('.chip:has-text("Journey")').first().click({ force: true }); await p.waitForTimeout(500); await shot('5-journey');
  await p.locator('.chip:has-text("Health")').first().click({ force: true }); await p.waitForTimeout(500); await shot('6-health');
  await p.locator('.fab').click({ force: true }); await p.waitForSelector('.ai-ind'); await p.fill('input[aria-label="Ask Ten Talents AI"]', 'What is leverage?'); await p.keyboard.press('Enter'); await p.waitForTimeout(400); await shot('7-ai');
  await p.locator('.sheet .iconbtn').first().click({ force: true });
  await tab('Profile'); await p.waitForTimeout(300); await p.locator('.lrow:has-text("Readiness Passport")').first().click({ force: true }); await p.waitForSelector('.passport'); await p.waitForTimeout(500); await shot('8-passport');
  await ctx.close();
  console.log(name, 'done');
}
await browser.close();
console.log(fs.readdirSync('store').length, 'files');
