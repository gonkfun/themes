import React,{useEffect,useState} from 'react';
import {Avatar,Badge,Blank,Card,Dialog,Field,Page} from './ui';
import {id,people,useLocal} from './model';
import {Records} from './apps';

export const connected=document.querySelector('meta[name="switchboard-mode"]')?.content==='connected';
export async function request(path,method='GET',body) {
    const res=await fetch('/api/'+path,{method,headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,cache:'no-store'});
    const data=await res.json();
    if(!res.ok)throw Object.assign(new Error(data.error),{status:res.status});
    return data;
}
const demoMembers=people.map((person,index)=>({...person,role:['Owner','Admin'][index]||'Member',active:1}));
const actionAt=(actor,action,detail)=>({id:id(),actor,action,detail,time:new Date().toISOString()});

export function Access({invite,onSuccess}) {
    const [error,setError]=useState('');
    const [busy,setBusy]=useState(false);
    return <Page title={invite?'Join the workspace':'Sign in to Switchboard'}><Card className="auth-card">
        <form className="stack" onSubmit={async event=>{
            event.preventDefault();
            setBusy(true);setError('');
            const data=Object.fromEntries(new FormData(event.currentTarget));
            try{const {member}=await request(invite?'accept':'sign-in','POST',invite?{...data,token:invite}:data);onSuccess(member);}
            catch(error){setError(error.message);}
            finally{setBusy(false);}
        }}>
            {invite?<Field label="Your name" name="name" maxLength={80} autoComplete="name" required/>:<Field label="Email" name="email" type="email" autoComplete="username" required/>}
            <Field label="Password" name="password" type="password" autoComplete={invite?'new-password':'current-password'} minLength={invite?12:undefined} maxLength={128} required/>
            {invite&&<small>Use at least 12 characters. Your account uses the email address on the invitation.</small>}
            {error&&<p role="alert">{error}</p>}
            <button className="primary" disabled={busy}>{busy?'Working…':invite?'Accept invitation':'Sign in'}</button>
        </form>
    </Card></Page>;
}

export function Team({member,onExpired}) {
    const [samples,setSamples]=useLocal('team-members',demoMembers);
    const [demoActivity,setDemoActivity]=useLocal('team-activity',[]);
    const [data,setData]=useState(null);
    const [activity,setActivity]=useState([]);
    const [query,setQuery]=useState('');
    const [tab,setTab]=useState('Members');
    const [dialog,setDialog]=useState(null);
    const [busy,setBusy]=useState(false);
    const [error,setError]=useState('');
    const [formError,setFormError]=useState('');
    const [link,setLink]=useState('');
    const [notice,setNotice]=useState('');
    const role=member?.role||'Owner';
    const directory=connected?data:samples;
    const feed=connected?activity:demoActivity;
    const isManager=role!=='Member';
    async function refresh(){
        setError('');
        try{
            const result=await request('team');
            setData(result.members);
            if(isManager)setActivity((await request('activity')).activity);
        }catch(error){if(error.status===401)onExpired();else setError(error.message);}
    }
    useEffect(()=>{if(connected)refresh();},[member?.role]);
    async function save(event){
        event.preventDefault();
        setBusy(true);setFormError('');
        const values=Object.fromEntries(new FormData(event.currentTarget));
        try{
            if(dialog==='invite'){
                if(connected){
                    const {link}=await request('invitations','POST',values);
                    setLink(link);setNotice('Invitation expires in 48 hours.');
                }else{
                    if(samples.some(item=>item.email===values.email.toLowerCase()))throw new Error('This email already appears in the demo.');
                    setSamples(items=>[...items,{id:id(),name:values.email.split('@')[0],email:values.email.toLowerCase(),role:values.role,active:0,invited:true}]);
                    setDemoActivity(items=>[actionAt(people[0].name,'Created a sample invitation',values.email),...items].slice(0,100));
                    setNotice('Sample invitation added.');setDialog(null);
                }
            }else{
                const change={role:values.role,active:values.status==='Active'};
                if(connected)setData((await request('team/'+dialog.id,'PATCH',change)).members);
                else{
                    setSamples(items=>items.map(item=>item.id===dialog.id?{...item,...change,invited:false}:item));
                    setDemoActivity(items=>[actionAt(people[0].name,'Updated a sample member',dialog.name),...items].slice(0,100));
                }
                setNotice('Member updated.');setDialog(null);
            }
            if(connected&&isManager)setActivity((await request('activity')).activity);
        }catch(error){
            if(error.status===401)onExpired();
            else setFormError(error.message);
        }finally{setBusy(false);}
    }
    function open(record){
        setDialog(record);setLink('');setFormError('');setNotice('');
    }
    const matches=(directory||[]).filter(item=>[item.name,item.email,item.role].some(value=>value?.toLowerCase().includes(query.trim().toLowerCase())));
    return <Page title="Team Admin" description={connected?'Manage workspace access and review team activity.':'Explore team management using sample accounts.'}
        actions={<>{connected&&<button onClick={refresh}>Refresh</button>}{isManager&&<button className="primary" onClick={()=>open('invite')}>Invite member</button>}</>}>
        {directory&&<div className="team-summary">
            {[[directory.length,'Members'],[directory.filter(item=>item.active).length,'Active'],[directory.filter(item=>['Owner','Admin'].includes(item.role)&&item.active).length,'Administrators']].map(([count,label])=><Card key={label} className="team-count"><span>{label}</span><strong>{count}</strong></Card>)}
        </div>}
        <div className="toolbar team-tabs">{(isManager?['Members','Activity']:['Members']).map(name=><button aria-pressed={tab===name} key={name} onClick={()=>setTab(name)}>{name}</button>)}</div>
        {notice&&<p role="status">{notice}</p>}
        {error&&<p role="alert">{error}</p>}
        {!directory&&!error&&<p role="status">Loading members…</p>}
        {tab==='Members'&&directory&&<Card title="Member directory">
            <Field label="Search members" type="search" value={query} onChange={event=>setQuery(event.target.value)}/>
            {matches.length?<div className="team-list">{matches.map(item=><article className="team-row" key={item.id}>
                <div className="contact-card"><Avatar name={item.name} color={item.color}/><div><strong>{item.name}</strong>{item.email&&<p>{item.email}</p>}</div></div>
                <Badge>{item.role}</Badge><span className="muted">{item.invited?'Invited':item.active?'Active':'Inactive'}</span>
                {role==='Owner'&&item.role!=='Owner'&&<button type="button" aria-label={'Edit '+item.name} onClick={()=>open(item)}>Edit</button>}
            </article>)}</div>:<Blank title="No members match this search"/>}
        </Card>}
        {tab==='Activity'&&isManager&&<Card title="Recent activity">
            {feed.length?<ol className="team-list">{feed.map(item=><li className="activity-row" key={item.id}><div><strong>{item.action}</strong><p>{item.actor} · {item.detail}</p></div><time dateTime={item.time}>{new Date(item.time).toLocaleString()}</time></li>)}</ol>:<Blank title="No activity yet" text="Membership and shared work changes appear here."/>}
        </Card>}
        {dialog&&<Dialog title={dialog==='invite'?'Invite a member':'Edit '+dialog.name} close={()=>setDialog(null)}>
            {link?<div className="stack"><p>Send this one-time link privately to the person you invited.</p><Field label="Invitation link" value={link} readOnly onFocus={event=>event.target.select()}/><button className="primary" onClick={async()=>{try{await navigator.clipboard.writeText(link);setFormError('');setNotice('Link copied.');}catch{setFormError('Select the link and copy it manually.');}}}>Copy link</button>{notice&&<p role="status">{notice}</p>}{formError&&<p role="alert">{formError}</p>}</div>:
                <form className="stack" onSubmit={save}>
                    {dialog==='invite'&&<Field label="Email" type="email" name="email" maxLength={254} required/>}
                    <Field label="Role"><select name="role" defaultValue={dialog.role||'Member'}><option>Member</option>{role==='Owner'&&<option>Admin</option>}</select></Field>
                    {dialog!=='invite'&&<Field label="Status"><select name="status" defaultValue={dialog.active?'Active':'Inactive'}><option>Active</option><option>Inactive</option></select></Field>}
                    {formError&&<p role="alert">{formError}</p>}
                    <button className="primary" disabled={busy}>{busy?'Saving…':dialog==='invite'?'Create invitation':'Save member'}</button>
                </form>}
        </Dialog>}
    </Page>;
}

export function SharedRecords({kind,member,onExpired}){
    const [data,setData]=useState(null);
    const [error,setError]=useState('');
    const [busy,setBusy]=useState(false);
    const report=error=>{if(error.status===401)onExpired();else setError(error.message);};
    async function refresh(){
        setBusy(true);setError('');
        try{setData(await request(kind));}catch(error){report(error);}finally{setBusy(false);}
    }
    useEffect(()=>{refresh();},[kind]);
    async function change(method,record){
        setBusy(true);setError('');
        try{
            setData(await request(kind+(record.id?'/'+record.id:''),method,record));
            return true;
        }catch(error){report(error);return false;}
        finally{setBusy(false);}
    }
    if(!data)return <Page title={kind==='board'?'Kanban':'Tickets'}>{error?<><p role="alert">{error}</p><button onClick={refresh}>Retry</button></>:<p role="status">Loading shared work…</p>}</Page>;
    return <Records kind={kind} shared={{...data,busy,error,refresh,change,canDelete:member.role!=='Member'}}/>;
}
