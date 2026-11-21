import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const target=process.env.BLOGGER_TEST_URL;
if(!target)throw new Error('Set BLOGGER_TEST_URL to your public Blogger test blog URL.');
if(!/^https:\/\//.test(target))throw new Error('Use a public HTTPS test blog.');
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true});
const results=[];
try{for(const width of [1366,390]){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(target);assert.equal(response.status(),200);assert.deepEqual(errors,[]);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 for(const sel of ['.ep-rail .Header','.ep-rail .BlogSearch','.ep-rail .Profile','.ReportAbuse','.Attribution'])for(const el of await page.locator(sel).all())assert.equal(await el.isVisible(),false,sel+' should be hidden');
 assert(await page.locator('.ep-credit').isVisible());
 assert.equal(await page.locator('link[rel="canonical"]').count(),1);
 assert.equal(await page.locator('meta[name="description"]').count(),1);
 assert.equal(await page.locator('meta[name="twitter:card"]').count(),1);
 assert.equal(await page.locator('link[rel="icon"][type="image/svg+xml"]').count(),1);
 assert.equal(await page.locator('body[itemtype="https://schema.org/WebSite"]').count(),1);
 await page.locator('[data-epoch-toggle]').click();assert.equal(await page.locator('html').getAttribute('data-epoch-mode'),'paper');
 if(width===390){await page.locator('.ep-mobile summary').click();await page.keyboard.press('Escape');assert.equal(await page.locator('.ep-mobile').getAttribute('open'),null);}
 results.push({width,passed:true,checks:['no JavaScript errors','no horizontal overflow','platform chrome hidden','Gonk credit visible','one canonical','one description','one Twitter card','custom favicon','site microdata','colour toggle']});
 await page.close();
}}finally{await browser.close();}
await fs.writeFile(new URL('./blogger-results.json',import.meta.url),JSON.stringify({url:target,results,postAndCommentPagesTested:false},null,2));
console.log('Live Blogger homepage passed at both widths, including metadata, favicon and interactions. Posts/comments not tested: empty blog.');
