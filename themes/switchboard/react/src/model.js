import { useEffect, useState } from 'react';

export const date = (year, month, day) => new Date(Date.UTC(year, month, day));
export const iso = value => value.toISOString().slice(0, 10);
export const dayOf = value => new Date(value + 'T00:00:00Z');
export const dateLabel = value => value ? new Intl.DateTimeFormat('en', {dateStyle:'medium',timeZone:'UTC'}).format(dayOf(value)) : '—';
export const currency = cents => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',maximumFractionDigits:0}).format(cents / 100);
export const number = value => new Intl.NumberFormat('en-US').format(value);
export const newest = (a,b) => String(b.date).localeCompare(String(a.date));
export const id = () => globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
export const productOptions = ['Desk lamp','Phone stand','Notebook','Cable kit','Monitor mount','Travel case'];
export const channels = ['Direct','Search','Referral','Email'];
export const stageNames = ['Backlog','In progress','Review','Done'];
export const sampleDay='2026-11-21';
export const people = [
    ['Leena Rao','Product','leena@example.test','Bengaluru','#7852af'],
    ['Maya Chen','Design','maya@example.test','Singapore','#16736c'],
    ['Noah Ward','Support','noah@example.test','London','#a55239'],
    ['Imani Cole','Operations','imani@example.test','Toronto','#325a9a'],
    ['Mateo Silva','Engineering','mateo@example.test','São Paulo','#805917'],
    ['Asha Mensah','Finance','asha@example.test','Accra','#944a77'],
].map(([name,role,email,city,color],i)=>({id:'person-'+i,name,role,email,city,color}));

export const activitySeed = Array.from({length:90},(_,i)=>({
    date:iso(date(2026,10,21-89+i)),
    visits:340 + Math.round(75*Math.sin(i*.29)+55*Math.cos(i*.12))+i*3+(i%7)*21,
    orders:7+(i*7%13)+Math.round(i/15),
    revenue:(610+(i*137%650)+i*7)*100,
    signups:12+(i*11%27)+Math.round(i/14),
}));
export const orders = Array.from({length:32},(_,i)=>({
    id:'SW-'+(3021-i), customer:people[i % people.length].name, item:productOptions[i%6],
    date:iso(date(2026,10,21-i)), status:['Paid','Processing','Shipped','Refunded'][i%4],
    total:(38+(i*39%288))*100, channel:channels[i%4], email:people[i%people.length].email
}));
export const products = productOptions.map((name,i)=>({
    id:'product-'+(i+1), name, category:['Lighting','Accessories','Stationery','Accessories','Furniture','Travel'][i],
    price:[12900,4900,2400,3800,14900,6400][i], stock:[24,7,56,18,4,32][i],
    tone:['peach','mint','lilac','blue','amber','rose'][i],
    description:['A low-glare lamp for focused work.','A stable home for your phone.','Smooth paper with a simple grid.','Keep a handful of cables in order.','An adjustable lift for a better desk.','A lightweight case with tidy pockets.'][i]
}));
export const tasks = [
    ['Review November orders','In progress','Maya Chen','High','2026-11-21'],
    ['Prepare the shipment notice','Review','Imani Cole','Normal','2026-11-22'],
    ['Publish team release notes','Done','Leena Rao','Normal','2026-11-19'],
    ['Reorder sample lighting units','Backlog','Asha Mensah','High','2026-11-25'],
    ['Document customer handoffs','In progress','Mateo Silva','Normal','2026-11-26'],
    ['Audit accessibility feedback','Review','Noah Ward','High','2026-11-24'],
    ['Draft the December collection','Backlog','Maya Chen','Low','2026-11-29']
].map(([title,stage,owner,priority,date],i)=>({id:'task-'+i,title,stage,owner,priority,date}));
export const events = [['Inventory review','2026-11-06','09:30'],['Studio handoff','2026-11-14','11:00'],['Collection check-in','2026-11-21','14:00'],['Shipping cutoff','2026-11-27','16:00']]
    .map(([title,date,time],i)=>({id:'event-'+i,title,date,time}));
export const notes = [['Release checklist','Check the package hashes and release notes before publishing.','peach',true],['Warehouse feedback','Add shelf labels near the returns desk.','mint',false],['Studio ideas','Test a softer task light for smaller rooms.','lilac',false]]
    .map(([title,body,tone,pinned],i)=>({id:'note-'+i,title,body,tone,pinned}));
export const tickets = [['T-401','Missing tracking link','Noah Ward','Open','High'],['T-402','Update invoice address','Asha Mensah','In progress','Normal'],['T-403','Where can I view returns?','Imani Cole','Resolved','Low']]
    .map(([id,title,owner,status,priority])=>({id,title,owner,status,priority}));
export const mail = [
    {id:'mail-1',from:'Maya Chen',subject:'Studio review agenda',body:'I have added the draft surfaces to the review. Please bring any mobile feedback.',read:false,folder:'Inbox'},
    {id:'mail-2',from:'Asha Mensah',subject:'November sample invoices',body:'The sample invoice register now includes the outstanding orders.',read:true,folder:'Inbox'},
    {id:'mail-3',from:'Noah Ward',subject:'Support handoff',body:'Two questions remain open. The current notes are in the tickets view.',read:false,folder:'Inbox'}
];
export const messages=[
    {id:'message-1',person:'Maya Chen',from:'Maya Chen',text:'The new catalogue is ready for review.'},
    {id:'message-2',person:'Maya Chen',from:'You',text:'I will check the mobile layout.'},
    {id:'message-3',person:'Noah Ward',from:'Noah Ward',text:'The November support summary is ready.'}
];
export const stories=[
    {id:'notes',title:'What belongs on an operations dashboard?',topic:'Design',summary:'Group the work around the decisions a team makes every day.',body:'Start with the decision. A count is useful when it tells someone which work to check. Keep a path from the summary to the records and label any data that is only used as an example.',tone:'lilac'},
    {id:'keyboard',title:'A keyboard-first workflow for busy teams',topic:'Guides',summary:'Build fast routes to find, sort, and inspect the work.',body:'Give every control a useful name. Shortcuts can help, but a visible path should always be available. Verify the focus order, table controls, dialogs and mobile navigation.',tone:'mint'},
    {id:'handoff',title:'Make a release handoff easy to verify',topic:'Operations',summary:'Capture the version, owner, changes and verification in one view.',body:'Write down who owns the next action and the conditions that make the work complete. Link to the exact build and keep the previous release available for comparison.',tone:'peach'}
];

export function useLocal(key, fallback) {
    const storageKey='switchboard:' + key;
    const [value,setValue]=useState(()=>{
        try { const stored=localStorage.getItem(storageKey); return stored===null?fallback:JSON.parse(stored); }
        catch { return fallback; }
    });
    useEffect(()=>{try {localStorage.setItem(storageKey,JSON.stringify(value));}catch{/* Storage unavailable. */}},[storageKey,value]);
    return [value,setValue];
}

export function exportCsv(filename, rows) {
    const escaped = rows.map(row=>row.map(value=>{
        const text=String(value??'');
        return '"' + (/^\s*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"','""') + '"';
    }).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([escaped],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a'); link.href=url; link.download=filename; link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export const navigation = [
    ['Dashboards',[['overview','Analytics','▦'],['sales','Commerce','▤']]],
    ['Applications',[['calendar','Calendar','▧'],['board','Kanban','▥'],['chat','Chat','◫'],['mail','Inbox','▱'],
        ['contacts','Contacts','◎'],['notes','Notes','▤'],['tickets','Tickets','◈'],['profile','Profile','◉']]],
    ['Commerce',[['catalog','Catalogue','◇'],['cart','Cart','▣'],['orders','Orders','≡'],['invoices','Invoices','▤']]],
    ['Examples',[['charts','Charts','∿'],['tables','Tables','≡'],['forms','Forms','□'],['components','Components','◇'],
        ['tree','Tree view','⌘'],['editor','Content editor','✎'],['blog','Blog','▱']]],
    ['Pages',[['landing','Home page','⌂'],['about','About','◎'],['portfolio','Portfolio','▦'],['pricing','Pricing','◈'],['contact','Contact','▱'],
        ['sign-in','Sign in','→'],['register','Register','+'],['recover','Recovery','↺'],['lock','Lock screen','◆'],['settings','Settings','⚙']]]
];
