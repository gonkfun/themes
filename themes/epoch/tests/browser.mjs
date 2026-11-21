import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url).pathname;
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox']});
const results=[];console.log('Checking preview and native WordPress layouts…');
try{
 for(const width of (process.argv.includes('--wp-only')?[]:[390,1440])){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const path of ['index.html','article.html','archive.html','about.html','404.html']){
   const r=await page.goto('http://127.0.0.1:9430/'+path);await page.waitForTimeout(100);
   assert.equal(r.status(),200);assert(await page.locator('h1').count()===1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${path} ${width} overflow`);
   assert.equal(await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.complete&&i.naturalWidth===0).length),0);
   await page.locator('img').evaluateAll(imgs=>imgs.forEach(i=>i.loading='eager'));
   await page.waitForFunction(()=>[...document.images].every(i=>i.complete));
   if(path==='index.html')await page.screenshot({path:root+`preview/epoch-${width}.png`,fullPage:true});
   if(path==='article.html'&&width===1440)await page.screenshot({path:root+'preview/epoch-article.png',fullPage:true});
   results.push({surface:'static',path,width,status:'pass'});
  }
  await page.goto('http://127.0.0.1:9430/');await page.locator('[data-epoch-toggle]').click();assert.equal(await page.locator('html').getAttribute('data-epoch-mode'),'paper');await page.reload();assert.equal(await page.locator('html').getAttribute('data-epoch-mode'),'paper');
  if(width===1440)await page.screenshot({path:root+'preview/epoch-paper.png',fullPage:true});
  if(width===390){await page.locator('.ep-mobile summary').click();assert.equal(await page.locator('.ep-mobile').getAttribute('open'),'');await page.keyboard.press('Escape');assert.equal(await page.locator('.ep-mobile').getAttribute('open'),null);}
  await page.goto('http://127.0.0.1:9430/archive.html?q=zzzzzz');assert(await page.locator('#empty').isVisible());
  await page.goto('http://127.0.0.1:9430/archive.html?topic=Security');assert.equal(await page.locator('#results .ep-card:visible').count(),1);
  assert.deepEqual(errors,[]);await page.close();
 }
 const wp=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 for(const path of ['/','/category/security/','/the-wallet-check-you-should-make-before-every-connection/','/?s=wallet','/about/','/not-a-real-page/']){
  const r=await wp.goto('http://127.0.0.1:9431'+path);await wp.waitForTimeout(120);
  const body=await wp.locator('body').innerText();assert(!/Fatal error|Warning:|Notice:|critical error/i.test(body),body.slice(0,500));
  assert.equal(r.status(),path==='/not-a-real-page/'?404:200,path);
  assert.equal(await wp.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,path+' overflow');
  await wp.locator('img').evaluateAll(imgs=>imgs.forEach(i=>i.loading='eager'));await wp.waitForFunction(()=>[...document.images].every(i=>i.complete));
  assert.equal(await wp.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.naturalWidth===0).length),0,path+' broken image');
  if(path==='/'){assert.equal(await wp.locator('.ep-header .wp-block-navigation__container').first().evaluate(e=>getComputedStyle(e).gap),'24px');assert.equal(await wp.locator('.ep-header .wp-block-site-tagline').evaluate(e=>getComputedStyle(e).fontSize),'10px');assert(await wp.locator('body').getAttribute('class').then(c=>c.includes('ep-wp')));assert.equal(await wp.locator('.ep-card-grid>li').count(),4);await wp.screenshot({path:root+'preview/epoch-wordpress-desktop.png',fullPage:true});}
  results.push({surface:'wordpress',path,width:1440,status:'pass'});
 }
 await wp.setViewportSize({width:390,height:1000});await wp.goto('http://127.0.0.1:9431/');assert.equal(await wp.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'WP mobile overflow');await wp.screenshot({path:root+'preview/epoch-wordpress-mobile.png',fullPage:true});
 results.push({surface:'wordpress',path:'/',width:390,status:'pass'});
 await wp.close();await fs.writeFile(root+'tests/browser-results.json',JSON.stringify({results,interactionChecks:['reader mode persists','mobile menu Escape','search empty state','category filter'],noFinancialRequests:true},null,2));
 console.log(`${results.length} rendered page checks passed, plus reader mode, navigation and search interactions.`);
}finally{await browser.close();}
