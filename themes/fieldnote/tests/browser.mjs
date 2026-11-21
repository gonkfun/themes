// Fieldnote browser checks for the static preview + screenshots. Needs Chrome: CHROME_BIN=/usr/bin/google-chrome node tests/browser.mjs
import {chromium} from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url).pathname, dir = root + 'preview/';
const types = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.xml':'application/xml','.png':'image/png'};
const server = http.createServer((q, r) => { const f = path.join(dir, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/\/$/, '/index.html')); if (!f.startsWith(dir) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, {'content-type': types[path.extname(f)] ?? 'application/octet-stream'}); fs.createReadStream(f).pipe(r); }).listen(9447, '127.0.0.1');
const browser = await chromium.launch({executablePath: process.env.CHROME_BIN, headless: true, args: ['--no-sandbox']});
const results = []; const base = 'http://127.0.0.1:9447/';
try {
 for (const width of [390, 1440]) {
  const page = await browser.newPage({viewport: {width, height: 1000}, reducedMotion: 'reduce'}); const errors = []; page.on('pageerror', e => errors.push(e.message));
  for (const p of ['index.html', 'article.html', 'archive.html', 'about.html', '404.html']) {
   const r = await page.goto(base + p); assert.equal(r.status(), 200); assert.equal(await page.locator('h1').count(), 1, p);
   assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${p} ${width} overflows`);
   await page.locator('img').evaluateAll(a => a.forEach(i => i.loading = 'eager'));
   await page.waitForFunction(() => [...document.images].every(i => i.complete));
   assert.equal(await page.locator('img').evaluateAll(a => a.filter(i => i.naturalWidth === 0).length), 0, `${p} broken image`);
   if (p === 'index.html') await page.screenshot({path: root + `preview/fieldnote-${width}.png`, fullPage: true});
   if (p === 'article.html' && width === 1440) await page.screenshot({path: root + 'preview/fieldnote-article.png', fullPage: true});
   results.push({path: p, width, status: 'pass'});
  }
  await page.goto(base); assert.match(await page.locator('[data-fieldnote-season]').textContent(), /Winter|Spring|Summer|Autumn/);
  await page.locator('[data-fieldnote-toggle]').click(); assert.equal(await page.locator('html').getAttribute('data-fieldnote-mode'), 'dusk');
  await page.reload(); assert.equal(await page.locator('html').getAttribute('data-fieldnote-mode'), 'dusk');
  if (width === 1440) await page.screenshot({path: root + 'preview/fieldnote-dusk.png', fullPage: true});
  await page.locator('[data-fieldnote-toggle]').click();
  if (width === 390) { await page.locator('.fn-mobile summary').click(); assert.equal(await page.locator('.fn-mobile').getAttribute('open'), ''); await page.keyboard.press('Escape'); assert.equal(await page.locator('.fn-mobile').getAttribute('open'), null); }
  await page.goto(base + 'archive.html?q=zzzz'); assert(await page.locator('#empty').isVisible());
  await page.goto(base + 'archive.html?topic=Fungi'); assert.equal(await page.locator('#results .fn-card:visible').count(), 1);
  assert.deepEqual(errors, []); await page.close();
 }
 // WordPress screenshot.png (1200x900) from the homepage design.
 const shot = await browser.newPage({viewport: {width: 1200, height: 900}, reducedMotion: 'reduce'});
 await shot.goto(base); await shot.addStyleTag({content: '.fn-demo-note{display:none}'}); await shot.screenshot({path: root + 'wordpress/fieldnote/screenshot.png'});
 await shot.close();
 // Favicon PNG and social card for Blogger users.
 const icon = await browser.newPage({viewport: {width: 96, height: 96}}); await icon.goto(base + 'assets/fieldnote-favicon.svg'); await icon.screenshot({path: root + 'blogger/assets/fieldnote-favicon-96.png', omitBackground: true}); await icon.close();
 const card = await browser.newPage({viewport: {width: 1200, height: 630}}); await card.goto(base); await card.addStyleTag({content: '.fn-demo-note,.fn-header,.fn-season,.fn-guide{display:none}.fn-lead-entry{padding-block:60px;border:0}'}); await card.screenshot({path: root + 'blogger/assets/fieldnote-social-card.png'}); await card.close();
} finally { await browser.close(); server.close(); }
fs.writeFileSync(root + 'tests/browser-results.json', JSON.stringify({checked: results.length, results}, null, 2));
console.log(`${results.length} preview pages passed at 390px and 1440px; dusk mode, season label, mobile menu, search and topic filters work; screenshots written.`);
