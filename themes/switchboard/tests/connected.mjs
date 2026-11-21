import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {randomBytes} from 'node:crypto';

const {chromium}=await import(process.env.SWITCHBOARD_PLAYWRIGHT||'playwright');
const temp=await mkdtemp(join(tmpdir(),'switchboard-connected-'));
const url='http://127.0.0.1:9472';
const pass=()=>randomBytes(24).toString('base64url');
const ownerPassword=pass(), memberPassword=pass();
const inherited={...process.env,SWITCHBOARD_ORIGIN:url,HOST:'127.0.0.1',PORT:'9472',SWITCHBOARD_DB:join(temp,'test.sqlite')};
async function start(first){
    const processHandle=spawn(process.execPath,[new URL('../react/server/index.mjs',import.meta.url).pathname],
        {env:{...inherited,SWITCHBOARD_OWNER_EMAIL:first?'owner@example.test':'',SWITCHBOARD_OWNER_PASSWORD:first?ownerPassword:''},stdio:['ignore','pipe','inherit']});
    try{
        await Promise.race([
            once(processHandle.stdout,'data'),
            once(processHandle,'exit').then(([code])=>{throw new Error('Server exited '+code);}),
            new Promise((_,reject)=>setTimeout(()=>reject(new Error('Startup timed out')),5000).unref())
        ]);
    }catch(error){processHandle.kill();throw error;}
    return processHandle;
}
async function stop(server){if(server?.exitCode===null){const done=once(server,'exit');server.kill();await done;}}
const heading=(page,name)=>page.getByRole('heading',{name,exact:true,level:1});
const button=(page,name)=>page.getByRole('button',{name,exact:true});
let server,browser;
try{
    server=await start(true);
    browser=await chromium.launch({executablePath:process.env.SWITCHBOARD_CHROMIUM||undefined});
    const owner=await browser.newPage({viewport:{width:1440,height:900}});
    const member=await browser.newPage({viewport:{width:390,height:844}});
    for(const page of [owner,member])page.setDefaultTimeout(7000);
    async function go(page,path,title){
        await page.goto(url+'/#/'+path);
        await heading(page,title).waitFor();
    }
    async function signIn(page,email,password){
        await heading(page,'Sign in to Switchboard').waitFor();
        await page.getByLabel('Email').fill(email);
        await page.getByLabel('Password').fill(password);
        await button(page,'Sign in').click();
        await heading(page,'Team Admin').waitFor();
    }
    assert.equal((await fetch(url+'/api/board')).status,401);
    await go(owner,'board','Sign in to Switchboard');
    await signIn(owner,'owner@example.test',ownerPassword);
    const cookies=await owner.context().cookies();
    assert(cookies.some(cookie=>cookie.httpOnly&&cookie.sameSite==='Lax'));
    await button(owner,'Invite member').click();
    await owner.getByLabel('Email',{exact:true}).fill('teammate@example.test');
    await button(owner,'Create invitation').click();
    const invite=await owner.getByLabel('Invitation link').inputValue();
    await member.goto(invite);
    await member.getByLabel('Your name').fill('Taylor Member');
    await member.getByLabel('Password').fill(memberPassword);
    await button(member,'Accept invitation').click();
    await heading(member,'Team Admin').waitFor();
    await member.getByText('Taylor Member',{exact:true}).waitFor();
    assert.equal(await button(member,'Invite member').count(),0);
    assert.equal((await member.request.get(url+'/api/activity')).status(),403);
    await member.goto(invite);
    await member.getByLabel('Your name').fill('Repeated invite');
    await member.getByLabel('Password').fill(memberPassword);
    await button(member,'Accept invitation').click();
    await member.getByRole('alert').getByText(/invalid or has expired/).waitFor();
    await go(owner,'board','Kanban');
    await button(owner,'+ New task').click();
    await owner.getByLabel('Title',{exact:true}).fill('Shared release review');
    await owner.getByLabel('Owner').selectOption({label:'Taylor Member'});
    await owner.getByLabel('Due date').fill('2026-11-25');
    await button(owner,'Save task').click();
    await button(owner,'Shared release review').waitFor();
    await go(member,'board','Kanban');
    await button(member,'Shared release review').click();
    assert.equal(await button(member,'Delete').count(),0);
    await button(member,'Close dialog').click();
    await member.getByLabel('Move Shared release review').selectOption('Review');
    await member.getByRole('region',{name:'Review'}).getByText('Shared release review').waitFor();
    await owner.getByLabel('Move Shared release review').selectOption('Done');
    await owner.getByRole('alert').getByText(/teammate changed/).waitFor();
    await button(owner,'Refresh').click();
    await owner.getByRole('region',{name:'Review'}).getByText('Shared release review').waitFor();
    await go(member,'tickets','Tickets');
    await button(member,'+ New ticket').click();
    await member.getByRole('dialog').getByLabel('Title',{exact:true}).fill('Shared support request');
    await button(member,'Save ticket').click();
    await member.getByRole('cell',{name:'Shared support request'}).waitFor();
    await go(owner,'tickets','Tickets');
    await owner.getByRole('cell',{name:'Shared support request'}).waitFor();
    await go(owner,'team','Team Admin');
    await button(owner,'Activity').click();
    await owner.getByText('Created ticket',{exact:true}).waitFor();
    await button(owner,'Members').click();
    await button(owner,'Edit Taylor Member').click();
    await owner.getByLabel('Role').selectOption({label:'Admin'});
    await button(owner,'Save member').click();
    await owner.getByRole('status').getByText('Member updated.').waitFor();
    await member.reload();
    await heading(member,'Tickets').waitFor();
    await go(member,'team','Team Admin');
    await button(member,'Invite member').click();
    assert.equal(await member.getByRole('option',{name:'Admin'}).count(),0);
    await button(member,'Close dialog').click();
    assert(await member.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await button(owner,'Edit Taylor Member').click();
    await owner.getByLabel('Status').selectOption({label:'Inactive'});
    await button(owner,'Save member').click();
    await owner.getByText('Inactive',{exact:true}).waitFor();
    await button(member,'Refresh').click();
    await heading(member,'Sign in to Switchboard').waitFor();
    await stop(server);
    server=await start(false);
    await go(owner,'board','Kanban');
    await button(owner,'Shared release review').waitFor();
    await button(owner,'Sign out').click();
    await heading(owner,'Sign in to Switchboard').waitFor();
    console.log('Connected workspace passed: invites, role permissions, shared tasks and tickets, stale edits, revocation, restart persistence, and sign-out.');
}finally{
    await browser?.close();
    await stop(server);
    await rm(temp,{recursive:true});
}
