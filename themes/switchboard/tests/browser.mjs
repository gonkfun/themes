import assert from 'node:assert/strict';
const {chromium}=await import(process.env.SWITCHBOARD_PLAYWRIGHT||'playwright');
const browser=await chromium.launch({executablePath:process.env.SWITCHBOARD_CHROMIUM||undefined});
const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
page.setDefaultTimeout(8000);
const base=process.env.SWITCHBOARD_URL||'http://127.0.0.1:9465/';
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)errors.push(response.url()+' '+response.status());});
async function route(path,title) {
    await page.goto(base+'#/'+path);
    await page.getByRole('heading',{name:title,exact:true,level:1}).waitFor();
}
const role=(role,name)=>page.getByRole(role,{name,exact:true});
await route('overview','Operations overview');
assert.equal(await page.locator('.feature-art img').evaluate(img=>img.decode().then(()=>img.naturalWidth>0)),true);
const gross=await page.locator('.metric strong').first().innerText();
await page.getByLabel('Reporting period').selectOption('7');
assert.notEqual(await page.locator('.metric strong').first().innerText(),gross);
await role('button','Dashboards').click();
await role('link','Commerce').click();
await role('heading','Commerce dashboard').waitFor();
await role('button','Appearance settings').click();
await page.getByLabel('Navigation layout').selectOption('Sidebar');
await page.getByLabel('Colour mode').selectOption('Dark');
await page.getByLabel('Text direction').selectOption('rtl');
await role('button','Close dialog').click();
await role('button','Collapse sidebar').click();
assert.equal(await page.locator('#app-sidebar .collapse').getAttribute('aria-label'),'Expand sidebar');
assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
await role('link','Kanban').click();
await role('button','+ New task').click();
await page.getByLabel('Title',{exact:true}).fill('Verify release board');
await page.getByLabel('Due date').fill('2026-11-25');
await role('button','Save task').click();
await page.getByLabel('Move Verify release board').selectOption('Done');
assert.equal(await page.getByRole('region',{name:'Done',exact:true}).getByText('Verify release board').count(),1);
await page.reload();
await role('button','Verify release board').waitFor();
await route('calendar','Calendar');
await role('button','+ New event').click();
await page.getByLabel('Title',{exact:true}).fill('Browser test event');
await page.getByLabel('Date',{exact:true}).fill('2026-11-19');
await role('button','Save event').click();
await page.getByRole('button',{name:/Browser test event/}).waitFor();
await route('notes','Notes');
await role('button','+ New note').click();
await page.getByLabel('Title',{exact:true}).fill('Browser test note');
await page.getByLabel('Note text').fill('This note stays in the browser.');
await role('button','Save note').click();
await role('heading','Browser test note').waitFor();
await route('mail','Inbox');
await role('button','Compose').click();
await page.getByLabel('To',{exact:true}).fill('sample@example.test');
await page.getByLabel('Subject').fill('Test draft');
await page.getByLabel('Message').fill('Local only');
await role('button','Save to demo sent folder').click();
await role('heading','Test draft').waitFor();
await route('catalog','Catalogue');
await role('link','Desk lamp').click();
await role('heading','Desk lamp').waitFor();
await role('button','Add to cart').click();
await role('link','Cart (1)').click();
await page.getByLabel('Customer name').fill('Browser test buyer');
await role('button','Create demo order').click();
await page.getByLabel('Filter records').fill('Browser test buyer');
await role('cell','Browser test buyer').waitFor();
await role('button','Edit').click();
await page.getByLabel('Order status').selectOption('Paid');
await role('button','Save order').click();
await role('cell','Paid').waitFor();
const download=page.waitForEvent('download');
await role('button','Export CSV').click();
assert.equal((await download).suggestedFilename(),'switchboard-records.csv');
await route('tables','Data table examples');
await page.getByText('Columns',{exact:true}).click();
await role('button','Move Customer earlier').click();
assert.match(await page.locator('thead th').nth(1).innerText(),/Customer/);
await page.getByLabel('Empty state').check();
await page.getByText('Nothing to show',{exact:true}).waitFor();
await route('forms','Forms');
await page.getByLabel('Full name').fill('Demo user');
await page.getByLabel('Email address').fill('sample@example.test');
await role('button','Continue').click();
await page.getByRole('combobox',{name:'Team'}).selectOption('Support');
await role('button','Continue').click();
await role('button','Save setup').click();
await page.getByText('Setup saved in this browser.').waitFor();
await role('button','Appearance settings').click();
await role('button','Reset appearance').click();
await role('button','Close dialog').click();
await route('team','Team Admin');
await role('button','Invite member').click();
await page.getByRole('dialog').getByLabel('Email').fill('static-invite@example.test');
await role('button','Create invitation').click();
await page.getByText('static-invite@example.test',{exact:true}).waitFor();
await role('button','Activity').click();
await page.getByText('Created a sample invitation',{exact:true}).waitFor();
const screens = {
    'catalog/product-1':'Desk lamp','orders/SW-3021':'Order SW-3021','invoices/SW-3021':'Invoice SW-3021',
    team:'Team Admin',overview:'Operations overview',sales:'Commerce dashboard',calendar:'Calendar',board:'Kanban',chat:'Chat',mail:'Inbox',
    contacts:'Contacts',notes:'Notes',tickets:'Tickets',profile:'Profile',catalog:'Catalogue',cart:'Cart',orders:'Orders',
    invoices:'Invoices',charts:'Chart gallery',tables:'Data table examples',forms:'Forms',components:'Component library',
    tree:'Tree view',editor:'Content editor',blog:'Studio journal','blog/notes':'What belongs on an operations dashboard?',
    landing:'Switchboard Studio',about:'About the studio',portfolio:'Selected work',pricing:'Sample pricing',contact:'Contact',
    'sign-in':'Sign in',register:'Create account',recover:'Reset password',lock:'Unlock workspace',settings:'Appearance'
};
for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    await page.setViewportSize(viewport);
    for(const [url,title] of Object.entries(screens)){
        await route(url,title);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow: '+url+' at '+viewport.width);
    }
}
await role('button','Open navigation').click();
await role('link','Analytics').click();
await role('heading','Operations overview').waitFor();
assert.equal(await role('button','Open navigation').getAttribute('aria-expanded'),'false');
await page.setViewportSize({width:1200,height:900});
if(process.env.SWITCHBOARD_COVER)await page.screenshot({path:process.env.SWITCHBOARD_COVER});
assert.deepEqual(errors,[]);
await browser.close();
console.log(Object.keys(screens).length+' routes checked at 390px and 1440px. Core interactions passed.');
