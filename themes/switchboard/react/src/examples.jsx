import React,{useState} from 'react';
import {stories,useLocal} from './model';
import {Page,Card,Badge,Dialog,Field,Blank} from './ui';

export function Examples({screen}) {
    const [open,setOpen]=useState(false);
    const [notice,setNotice]=useState('');
    const [step,setStep]=useState(0);
    const [entry,setEntry]=useLocal('form-demo',{name:'',email:'',team:'Design'});
    const [checked,setChecked]=useState({});
    const [blocks,setBlocks]=useLocal('editor-demo',[{type:'Heading',text:'Workspace handoff'},{type:'Paragraph',text:'Add a summary and list the next steps.'}]);
    const teams=['Design','Support','Operations'];
    const tree=[['Workspace',['Dashboard','People','Reports']],['Commerce',['Orders','Products','Invoices']],['Content',['Drafts','Published','Archive']]];
    if(screen==='forms') return <Page title="Forms"><div className="split-even"><Card title="Workspace setup">
        <form className="stack" onSubmit={event=>{
            event.preventDefault();
            if(step===2){setNotice('Setup saved in this browser.');return;}
            setStep(step+1);setNotice('');
        }}>
            <p className="muted">Step {step+1} of 3</p>
            {step===0&&<><Field label="Full name" value={entry.name} required onChange={event=>setEntry({...entry,name:event.target.value})}/><Field label="Email address" type="email" value={entry.email} required onChange={event=>setEntry({...entry,email:event.target.value})}/></>}
            {step===1&&<Field label="Team"><select value={entry.team} onChange={event=>setEntry({...entry,team:event.target.value})}>{teams.map(team=><option key={team}>{team}</option>)}</select></Field>}
            {step===2&&<p>{entry.name} · {entry.email} · {entry.team}</p>}
            <div className="toolbar">{step>0&&<button type="button" onClick={()=>{setStep(step-1);setNotice('');}}>Back</button>}<button className="primary">{step===2?'Save setup':'Continue'}</button></div>
            <p role="status">{notice}</p>
        </form>
    </Card><Card title="Input controls"><div className="stack"><Field label="Launch date" type="date"/><Field label="Search workspace" type="search"/><Field label="Daily limit" type="number" min={1} max={50} defaultValue={10}/><label><input type="checkbox"/> Send digest</label><Field label="Relevance"><input type="range" min={0} max={100}/></Field></div></Card></div></Page>;
    if(screen==='tree') return <Page title="Tree view"><div className="split-even"><Card title="Workspace permissions">
        {tree.map(([group,items])=><details className="tree" key={group} open><summary>{group}</summary><ul>{items.map(item=><li key={item}><label><input type="checkbox" checked={Boolean(checked[item])} onChange={event=>setChecked({...checked,[item]:event.target.checked})}/>{item}</label></li>)}</ul></details>)}
    </Card><Card title="Selected nodes"><p role="status">{Object.keys(checked).filter(key=>checked[key]).join(', ')||'Choose a node to begin.'}</p><button onClick={()=>setChecked({})}>Clear selection</button></Card></div></Page>;
    if(screen==='editor') return <Page title="Content editor"><div className="split-even"><Card title="Blocks">
        <div className="stack">{blocks.map((block,index)=><div className="editor-block" key={index}><Field label={block.type}><textarea value={block.text} rows={block.type==='Heading'?2:4} onChange={event=>setBlocks(items=>items.map((item,n)=>n===index?{...item,text:event.target.value}:item))}/></Field><button onClick={()=>setBlocks(items=>items.filter((_,n)=>n!==index))} aria-label={'Remove block '+(index+1)}>Remove</button></div>)}</div>
        <div className="toolbar">{['Heading','Paragraph','Quote'].map(type=><button key={type} onClick={()=>setBlocks(items=>[...items,{type,text:''}])}>+ {type}</button>)}</div>
    </Card><Card title="Preview">{blocks.map((block,index)=>block.type==='Heading'?<h3 key={index}>{block.text}</h3>:block.type==='Quote'?<blockquote key={index}>{block.text}</blockquote>:<p key={index} className="preserve">{block.text}</p>)}</Card></div></Page>;
    return <Page title="Component library"><div className="cards-three">
        <Card title="Buttons and badges"><div className="toolbar"><button className="primary" onClick={()=>setNotice('Action completed.')}>Primary</button><button onClick={()=>setNotice('Secondary action completed.')}>Secondary</button><button disabled>Disabled</button></div><div className="toolbar"><Badge>Paid</Badge><Badge>Processing</Badge><Badge>Overdue</Badge><Badge>Review</Badge></div></Card>
        <Card title="Dialogs and feedback"><div className="toolbar"><button onClick={()=>setOpen(true)}>Open dialog</button><button onClick={()=>setNotice('This is a demo notification.')}>Show notification</button></div><p role="status">{notice}</p></Card>
        <Card title="Accordions"><details className="tree"><summary>Spacing</summary><p>Controls, rows, and panels use shared spacing variables.</p></details><details className="tree"><summary>Navigation</summary><p>Choose a layout using the appearance panel.</p></details></Card>
    </div>{open&&<Dialog title="Example dialog" close={()=>setOpen(false)}><p>Use a dialog when an action needs a short decision.</p><button className="primary" onClick={()=>setOpen(false)}>Done</button></Dialog>}</Page>;
}

const plans=[['Starter','Free','One workspace','Sample dashboards'],['Studio','$24','Five workspaces','Team views'],['Enterprise','Contact','Custom workspaces','Onboarding']];
export function Pages({screen,detail}) {
    const [notice,setNotice]=useState('');
    const story=stories.find(item=>item.id===detail);
    if(screen==='blog') return story?<Page title={story.title} description={story.summary}><article className="card reading"><Badge>{story.topic}</Badge><p>{story.body}</p><a href="#/blog">Back to the journal</a></article></Page>:<Page title="Studio journal"><div className="cards-three">{stories.map(item=><Card key={item.id}><div className={'story-art tint '+item.tone} aria-hidden="true"/><Badge>{item.topic}</Badge><h2><a href={'#/blog/'+item.id}>{item.title}</a></h2><p>{item.summary}</p></Card>)}</div></Page>;
    if(screen==='contact') return <Page title="Contact"><Card title="Send a note" className="reading"><form className="stack" onSubmit={event=>{event.preventDefault();setNotice('Demo complete. No message was sent.');event.currentTarget.reset();}}>
        <Field label="Name" required/><Field label="Email" type="email" required/><Field label="Message"><textarea required rows="6" /></Field><button className="primary">Try contact form</button><p role="status">{notice}</p>
    </form></Card></Page>;
    if(screen==='pricing') return <Page title="Sample pricing"><div className="cards-three">{plans.map(([name,price,...features])=><Card title={name} key={name}><span className="big">{price}</span><ul>{features.map(feature=><li key={feature}>{feature}</li>)}</ul><a className="button" href="#/contact">Contact the studio</a></Card>)}</div></Page>;
    if(screen==='portfolio') return <Page title="Selected work"><div className="cards-three">{stories.map((item,index)=><Card key={item.id}><div className={'story-art tint '+item.tone} aria-hidden="true"/><h2>{['Editorial system','Operations workspace','Commerce refresh'][index]}</h2><p>{item.summary}</p><a href={'#/blog/'+item.id}>Read case study</a></Card>)}</div></Page>;
    if(screen==='about') return <Page title="About the studio"><div className="split-even"><Card title="What we work on"><p>Switchboard Studio is the sample team behind the order, project and analytics data in this template.</p><a href="#/contacts">Meet the demo team</a></Card><Card title="How we work"><p>Readable reports, clear ownership and practical workflows.</p><a href="#/portfolio">Browse sample projects</a></Card></div></Page>;
    return <Page title="Switchboard Studio"><section className="marketing-hero"><div><h2>Work in view.</h2><p>A shared workspace for orders, projects, and the people who keep them moving.</p><a href="#/overview" className="button primary">Open dashboard</a></div><img alt="" src={import.meta.env.BASE_URL+'art/switchboard-art.webp'}/></section><div className="cards-three">{[['about','About'],['portfolio','Portfolio'],['blog','Studio journal']].map(([path,name])=><Card title={name} key={path}><a href={'#/'+path}>Explore {name.toLowerCase()}</a></Card>)}</div></Page>;
}

export function AuthDemo({screen}) {
    const [notice,setNotice]=useState('');
    const titles={'sign-in':'Sign in',register:'Create account',recover:'Reset password',lock:'Unlock workspace'};
    return <Page title={titles[screen]}><Card className="auth-card" subtitle="Preview the authentication form. Use sample details.">
        <form className="stack" onSubmit={event=>{event.preventDefault();event.currentTarget.reset();setNotice('Form validated in the demo. No account or session was created.');}}>
            {screen==='register'&&<Field label="Name" autoComplete="name" required/>}
            {screen!=='lock'&&<Field label="Email" type="email" autoComplete="email" placeholder="you@example.test" required/>}
            {screen!=='recover'&&<Field label="Password" type="password" autoComplete={screen==='register'?'new-password':'current-password'} minLength={8} required/>}
            <button className="primary">{titles[screen]}</button><p role="status">{notice}</p>
        </form><div className="toolbar">{Object.entries(titles).filter(([key])=>key!==screen).map(([key,name])=><a key={key} href={'#/'+key}>{name}</a>)}</div>
    </Card></Page>;
}
