// Native WordPress fixture checks; run against the disposable blueprint server.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.WP_URL||'http://127.0.0.1:9452';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,args:['--no-sandbox']});const results=[];
try{for(const width of [390,1440]){
 const p=await browser.newPage({viewport:{width,height:1000}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 for(const route of ['/','/a-house-sparrow-learns-the-feeder/','/?s=sparrow','/category/birds/','/not-a-real-fieldnote-page/']){
 const response=await p.goto(base+route);assert.equal(response.status(),route.includes('not-a-real')?404:200);
 await p.locator('img').evaluateAll(xs=>xs.forEach(x=>x.loading='eager'));await p.waitForFunction(()=>[...document.images].every(x=>x.complete));
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${route} overflow ${width}`);assert.equal(await p.locator('img').evaluateAll(xs=>xs.filter(x=>!x.naturalWidth).length),0,`${route} broken images`);
 if(route==='/'){assert.equal(await p.locator('.fn-cards>li').count(),4);await p.locator('[data-fieldnote-toggle]').click();assert.equal(await p.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(27, 30, 25)');await p.reload();assert.equal(await p.locator('html').getAttribute('data-fieldnote-mode'),'dusk');if(width===390){await p.locator('.fn-header .wp-block-navigation__responsive-container-open').click();assert(await p.locator('.fn-header .wp-block-navigation__responsive-container.is-menu-open').isVisible());await p.keyboard.press('Escape');}await p.screenshot({path:new URL(`../preview/wordpress-${width}.png`,import.meta.url).pathname,fullPage:true});}
 if(route.includes('a-house')){assert.equal(await p.locator('.fn-prose .fn-margin').count(),2);assert(await p.getByText('Observed: date',{exact:true}).isVisible());assert(await p.getByText('A thoughtful field observation.',{exact:true}).isVisible());assert(await p.locator('#commentform').isVisible());}results.push({width,route,status:'pass'});
 }
 await p.goto(base+'/page/2/');assert.equal(await p.locator('.fn-cards>li').count(),2);assert.deepEqual(errors,[]);await p.close();
}}finally{await browser.close();}
fs.writeFileSync(new URL('wordpress-results.json',import.meta.url),JSON.stringify({environment:'WordPress 6.8 / PHP 8.3 Playground',results},null,2));console.log(`${results.length} native WordPress route checks passed; pagination, patterns, Group style, comments, dusk and mobile navigation passed.`);
