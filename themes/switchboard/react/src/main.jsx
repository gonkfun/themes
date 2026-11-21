import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {navigation,useLocal,people} from './model';
import {Avatar,Badge,Card,Dialog,Field,Page,Blank} from './ui';
import {Overview,Charts,Tables} from './dashboards';
import {Records,Chat,Inbox,Profile} from './apps';
import {Commerce} from './commerce';
import {Examples,Pages,AuthDemo} from './examples';
import './style.css';

const links=navigation.flatMap(([,items])=>items);
const layouts=['Horizontal','Sidebar','Compact'];
const modes=['System','Light','Dark'];
const accents={Pine:'#23745d',Cobalt:'#3e61ad',Plum:'#8150aa',Brick:'#aa4b42',Amber:'#8d640c',Slate:'#526777'};
const defaults={layout:'Horizontal',mode:'Light',accent:'Pine',direction:'ltr'};
const readRoute=()=>location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);

function Icon({name}) {
    const paths={panel:'M3 5h18v14H3zM9 5v14',search:'M17 17l4 4M3 10a7 7 0 1 0 14 0 7 7 0 0 0-14 0z',menu:'M4 6h16M4 12h16M4 18h16',settings:'M4 7h16M4 17h16M8 4v6m8 4v6',bell:'M5 17h14l-2-4V9a5 5 0 0 0-10 0v4zM10 21h4',bag:'M4 8h16l-1 13H5zM9 8V6a3 3 0 0 1 6 0v2',sun:'M12 3v2m0 14v2M3 12h2m14 0h2M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'};
    return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]}/></svg>;
}

function Navigation({route,horizontal=false,close}) {
    const [group,setGroup]=useState(null);
    return <nav className={horizontal?'horizontal-nav':'side-nav'} aria-label="Main navigation" onKeyDown={event=>{if(event.key==='Escape'){document.getElementById('nav-'+group)?.focus();setGroup(null);}}}>
        {navigation.map(([name,items])=><div className="nav-group" key={name} onBlur={event=>{if(horizontal&&!event.currentTarget.contains(event.relatedTarget))setGroup(null);}}>
            {horizontal?<button className="nav-trigger" id={'nav-'+name} aria-expanded={group===name} onClick={()=>setGroup(group===name?null:name)}>{name} <span aria-hidden="true">⌄</span></button>:<p>{name}</p>}
            {(!horizontal||group===name)&&<div className="nav-links">{items.map(([path,label,mark])=><a key={path} href={'#/'+path} title={label} aria-label={label} aria-current={route===path?'page':undefined} onClick={()=>{setGroup(null);close?.();}}><span aria-hidden="true">{mark}</span><span>{label}</span></a>)}</div>}
        </div>)}
    </nav>;
}

function Appearance({settings,setSettings}) {
    const change=(key,value)=>setSettings(previous=>({...previous,[key]:value}));
    return <div className="stack">
        <Field label="Navigation layout"><select value={settings.layout} onChange={event=>change('layout',event.target.value)}>{layouts.map(layout=><option key={layout}>{layout}</option>)}</select></Field>
        <Field label="Colour mode"><select value={settings.mode} onChange={event=>change('mode',event.target.value)}>{modes.map(mode=><option key={mode}>{mode}</option>)}</select></Field>
        <Field label="Text direction"><select value={settings.direction} onChange={event=>change('direction',event.target.value)}><option value="ltr">Left to right</option><option value="rtl">Right to left</option></select></Field>
        <fieldset><legend>Accent colour</legend><div className="toolbar swatches">{Object.entries(accents).map(([name,hex])=><button title={name} aria-label={name} key={name} aria-pressed={settings.accent===name} style={{background:hex}} onClick={()=>change('accent',name)}>{settings.accent===name?'✓':''}</button>)}</div></fieldset>
        <button onClick={()=>setSettings(defaults)}>Reset appearance</button>
    </div>;
}

function App() {
    const [[route='overview',detail],setRoute]=useState(readRoute);
    const [settings,setSettings]=useLocal('appearance',defaults);
    const [cart,setCart]=useLocal('cart',{});
    const [menu,setMenu]=useState(false);
    const [dialog,setDialog]=useState('');
    const [query,setQuery]=useState('');
    const [profile]=useLocal('profile',people[0]);
    const [systemDark,setSystemDark]=useState(()=>matchMedia('(prefers-color-scheme: dark)').matches);
    const dark=settings.mode==='Dark'||(settings.mode==='System'&&systemDark);
    const horizontal=settings.layout==='Horizontal';
    const page=links.find(([key])=>route===key);
    useEffect(()=>{
        const onHash=()=>{setRoute(readRoute());setMenu(false);setDialog('');window.scrollTo(0,0);};
        const match=matchMedia('(prefers-color-scheme: dark)');
        const onMode=()=>setSystemDark(match.matches);
        addEventListener('hashchange',onHash);match.addEventListener('change',onMode);
        return ()=>{removeEventListener('hashchange',onHash);match.removeEventListener('change',onMode);};
    },[]);
    useEffect(()=>{
        document.documentElement.dataset.theme=dark?'dark':'light';
        document.documentElement.dir=settings.direction;
        document.documentElement.dataset.accent=settings.accent;
        document.documentElement.style.setProperty('--accent',accents[settings.accent]);
    },[dark,settings.accent,settings.direction]);
    useEffect(()=>{document.title=(page?.[1]||'Page unavailable')+' · Switchboard';},[page]);
    const appearance=<Appearance settings={settings} setSettings={setSettings}/>;
    const brand=<a className="brand" href="#/overview" aria-label="Switchboard home"><span className="brand-mark" aria-hidden="true"><i/><i/><i/><i/></span><span>Switchboard</span></a>;
    let content;
    if(route==='overview'||route==='sales') content=<Overview commerce={route==='sales'}/>;
    else if(route==='charts') content=<Charts/>;
    else if(route==='tables') content=<Tables/>;
    else if(['board','calendar','contacts','notes','tickets'].includes(route)) content=<Records kind={route}/>;
    else if(route==='chat') content=<Chat/>;
    else if(route==='mail') content=<Inbox/>;
    else if(route==='profile') content=<Profile/>;
    else if(['catalog','cart','orders','invoices'].includes(route)) content=<Commerce screen={route} detail={detail} cart={cart} setCart={setCart}/>;
    else if(['forms','tree','editor','components'].includes(route)) content=<Examples screen={route}/>;
    else if(['landing','about','portfolio','pricing','contact','blog'].includes(route)) content=<Pages screen={route} detail={detail}/>;
    else if(['sign-in','register','recover','lock'].includes(route)) content=<AuthDemo screen={route}/>;
    else if(route==='settings') content=<Page title="Appearance"><Card className="reading">{appearance}</Card></Page>;
    else content=<Page title="Page unavailable"><Blank text="Choose a destination from the navigation."/><a href="#/overview">Open analytics</a></Page>;
    const cartCount=Object.values(cart).reduce((sum,value)=>sum+value,0);
    return <div className={'shell layout-'+settings.layout.toLowerCase()+(menu?' menu-open':'')}>
        <a className="skip-link" href="#main" onClick={event=>{event.preventDefault();document.getElementById('main').focus();}}>Skip to content</a>
        <header className="masthead"><div className="masthead-inner">
            {horizontal&&brand}<button className="icon-button mobile-menu" type="button" aria-label={menu?'Close navigation':'Open navigation'} aria-expanded={menu} aria-controls="app-sidebar" onClick={()=>setMenu(!menu)}><Icon name="menu"/></button>
            {!horizontal&&<span className="workspace-name">Studio workspace</span>}
            <button className="mast-search" onClick={()=>{setQuery('');setDialog('search');}} aria-label="Find a page"><Icon name="search"/><span>Find a page</span></button>
            <div className="header-tools"><Badge>Demo workspace</Badge>
                <button className="icon-button" aria-label="Notifications" onClick={()=>setDialog('notifications')}><Icon name="bell"/></button>
                <a className="icon-button" aria-label={'Cart ('+cartCount+')'} href="#/cart"><Icon name="bag"/>{cartCount>0&&<sup>{cartCount}</sup>}</a>
                <button className="icon-button" aria-label="Appearance settings" onClick={()=>setDialog('appearance')}><Icon name="settings"/></button>
                <a className="icon-button user-link" aria-label="Profile" href="#/profile"><Avatar name={profile.name}/></a>
            </div>
        </div>{horizontal&&<Navigation route={route} horizontal/>}</header>
        <aside className="sidebar" id="app-sidebar"><div className="side-top">{brand}
            {!horizontal&&<button className="icon-button collapse" title={settings.layout==='Compact'?'Expand sidebar':'Collapse sidebar'} aria-label={settings.layout==='Compact'?'Expand sidebar':'Collapse sidebar'} aria-expanded={settings.layout!=='Compact'} onClick={()=>setSettings(previous=>({...previous,layout:previous.layout==='Compact'?'Sidebar':'Compact'}))}><Icon name="panel"/></button>}
        </div><Navigation route={route} close={()=>setMenu(false)}/></aside>
        {menu&&<button className="sidebar-overlay" aria-label="Dismiss navigation" onClick={()=>setMenu(false)}/>}
        <main id="main" tabIndex={-1} key={route+'/'+(detail||'')}>{content}
            <footer className="footer"><span>Switchboard</span><span>Powered by <a href="https://gonk.fun" rel="nofollow">gonk.fun</a></span></footer>
        </main>
        {dialog&&<Dialog title={dialog==='appearance'?'Appearance':dialog==='search'?'Find a page':'Notifications'} close={()=>setDialog('')}>
            {dialog==='appearance'?appearance:dialog==='search'?<><Field label="Search pages"><input autoFocus type="search" value={query} onChange={event=>setQuery(event.target.value)} /></Field><div className="search-list">
                {links.filter(([,label])=>label.toLowerCase().includes(query.trim().toLowerCase())).map(([path,label,mark])=><a key={path} href={'#/'+path} onClick={()=>setDialog('')}><span aria-hidden="true">{mark}</span> {label}</a>)}</div></>:<div className="stack"><a href="#/orders">Review recent orders</a><a href="#/calendar">Check the studio calendar</a><a href="#/tickets">Review support tickets</a></div>}
        </Dialog>}
    </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
