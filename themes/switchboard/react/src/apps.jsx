import React, {useState} from 'react';
import {people,tasks,events,notes,tickets,mail,messages,stageNames,sampleDay,date,iso,dayOf,dateLabel,id,useLocal} from './model';
import {Page,Card,Badge,Avatar,Dialog,Field,Blank,DataTable} from './ui';

const title = {key:'title',label:'Title'};
const owner = {key:'owner',label:'Owner',options:people.map(person=>person.name)};
const priority = {key:'priority',label:'Priority',options:['Normal','Low','High']};
const specs = {
    board: {title:'Kanban',single:'Task',seed:tasks,fields:[title,{key:'stage',label:'Stage',options:stageNames},owner,priority,{key:'date',label:'Due date',type:'date'}]},
    calendar: {title:'Calendar',single:'Event',seed:events,fields:[title,{key:'date',label:'Date',type:'date'},{key:'time',label:'Time',type:'time'}]},
    contacts: {title:'Contacts',single:'Contact',seed:people,fields:[{key:'name',label:'Name'},{key:'email',label:'Email',type:'email'},{key:'role',label:'Role'},{key:'city',label:'City'}]},
    notes: {title:'Notes',single:'Note',seed:notes,fields:[title,{key:'body',label:'Note text',type:'textarea'},{key:'tone',label:'Colour',options:['peach','mint','lilac','blue','amber','rose']}]},
    tickets: {title:'Tickets',single:'Ticket',seed:tickets,fields:[title,owner,priority,{key:'status',label:'Status',options:['Open','In progress','Resolved']}]}
};

function RecordEditor({spec,record,onSave,onDelete,close}) {
    return <Dialog title={(record.id?'Edit ':'New ')+spec.single.toLowerCase()} close={close}>
        <form className="stack" onSubmit={event=>{
            event.preventDefault();
            onSave({...record,...Object.fromEntries(new FormData(event.currentTarget))});
        }}>
            {spec.fields.map(({key,label,type,options})=><Field key={key} label={label}>{options
                ? <select name={key} defaultValue={record[key]||options[0]}>{options.map(option=><option key={option}>{option}</option>)}</select>
                : type==='textarea' ? <textarea required name={key} defaultValue={record[key]||''} rows="5" />
                    : <input required name={key} type={type||'text'} defaultValue={record[key]||''}/>}</Field>)}
            <div className="toolbar"><button className="primary">Save {spec.single.toLowerCase()}</button>{record.id&&<button className="danger" type="button" onClick={()=>onDelete(record.id)}>Delete</button>}</div>
        </form>
    </Dialog>;
}

export function Records({kind}) {
    const spec=specs[kind];
    const [records,setRecords]=useLocal(kind,spec.seed);
    const [editor,setEditor]=useState(null);
    const [query,setQuery]=useState('');
    const [month,setMonth]=useState(()=>dayOf(sampleDay));
    const filtered=records.filter(record=>Object.values(record).some(value=>String(value).toLowerCase().includes(query.trim().toLowerCase())));
    const update=(record)=>setRecords(items=>items.map(item=>item.id===record.id?record:item));
    function moveTask(key,stage) {
        const task=records.find(record=>record.id===key);
        if(task) update({...task,stage});
    }
    const dayCount=date(month.getUTCFullYear(),month.getUTCMonth()+1,0).getUTCDate();
    const offset=(date(month.getUTCFullYear(),month.getUTCMonth(),1).getUTCDay()+6)%7;
    const changeMonth=delta=>setMonth(date(month.getUTCFullYear(),month.getUTCMonth()+delta,1));
    return <Page title={spec.title} actions={<button className="primary" onClick={()=>setEditor(kind==='calendar'?{date:iso(month),time:'09:00'}:{})}>+ New {spec.single.toLowerCase()}</button>}>
        {kind!=='calendar'&&kind!=='tickets'&&<Field label={'Find '+spec.title.toLowerCase()}><input type="search" value={query} onChange={event=>setQuery(event.target.value)}/></Field>}
        {kind==='calendar'&&<Card className="calendar" title={Intl.DateTimeFormat('en',{month:'long',year:'numeric',timeZone:'UTC'}).format(month)}
            action={<div className="toolbar"><button onClick={()=>changeMonth(-1)} aria-label="Previous month">←</button><button onClick={()=>setMonth(dayOf(sampleDay))}>Demo month</button><button onClick={()=>changeMonth(1)} aria-label="Next month">→</button></div>}>
            <div className="calendar-grid">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=><strong key={day}>{day}</strong>)}
                {Array.from({length:offset},(_,n)=><div key={'blank'+n}/>)}
                {Array.from({length:dayCount},(_,n)=>{
                    const day=iso(date(month.getUTCFullYear(),month.getUTCMonth(),n+1));
                    return <div key={day} className="calendar-day"><button className="quiet" aria-label={'Add event on '+dateLabel(day)} onClick={()=>setEditor({date:day,time:'09:00'})}>{n+1}</button>
                        {records.filter(record=>record.date===day).map(record=><button key={record.id} className="calendar-event" onClick={()=>setEditor(record)}><span>{record.time}</span> {record.title}</button>)}</div>;
                })}
            </div></Card>}
        {kind==='board'&&<div className="board">{stageNames.map(stage=><section key={stage} className="lane" aria-label={stage} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();moveTask(event.dataTransfer.getData('text/plain'),stage);}}>
            <h2>{stage} <Badge>{filtered.filter(task=>task.stage===stage).length}</Badge></h2>
            {filtered.filter(task=>task.stage===stage).map(task=><article className="card task" key={task.id} draggable onDragStart={event=>event.dataTransfer.setData('text/plain',task.id)}>
                <button className="text-button" onClick={()=>setEditor(task)}>{task.title}</button><p>{task.owner} · {dateLabel(task.date)}</p><Badge>{task.priority}</Badge>
                <select aria-label={'Move '+task.title} value={task.stage} onChange={event=>moveTask(task.id,event.target.value)}>{stageNames.map(option=><option key={option}>{option}</option>)}</select>
            </article>)}
        </section>)}</div>}
        {kind==='contacts'&&<div className="cards-three">{filtered.map(person=><Card key={person.id}>
            <div className="contact-card"><Avatar name={person.name} color={person.color}/><div><h2>{person.name}</h2><p>{person.role} · {person.city}</p></div></div><p>{person.email}</p><button onClick={()=>setEditor(person)}>Edit contact</button>
        </Card>)}</div>}
        {kind==='notes'&&<div className="cards-three">{[...filtered].sort((a,b)=>Number(Boolean(b.pinned))-Number(Boolean(a.pinned))).map(note=><Card key={note.id} className={'tint '+note.tone} title={note.title}>
            <p className="preserve">{note.body}</p><div className="toolbar"><button onClick={()=>setEditor(note)}>Edit note</button><button aria-pressed={Boolean(note.pinned)} onClick={()=>update({...note,pinned:!note.pinned})}>{note.pinned?'Unpin':'Pin'}</button></div>
        </Card>)}</div>}
        {kind==='tickets'&&<DataTable rows={records} columns={spec.fields} title="Support tickets" filename="switchboard-tickets.csv" onEdit={setEditor}/>}
        {!['calendar','tickets'].includes(kind)&&!filtered.length&&<Blank/>}
        {editor&&<RecordEditor spec={spec} record={editor} close={()=>setEditor(null)} onSave={record=>{
            if(record.id) update(record);
            else setRecords(items=>[...items,{...record,id:id()}]);
            if(kind==='calendar') setMonth(dayOf(record.date));
            setEditor(null);
        }} onDelete={key=>{setRecords(items=>items.filter(item=>item.id!==key));setEditor(null);}}/>}
    </Page>;
}

export function Chat() {
    const [thread,setThread]=useState(people[1].name);
    const [history,setHistory]=useLocal('messages',messages);
    return <Page title="Chat" description="Messages are saved in this browser."><div className="split-app">
        <Card title="Conversations">{people.map(person=><button className="list-button" key={person.id} aria-pressed={thread===person.name} onClick={()=>setThread(person.name)}><Avatar name={person.name} color={person.color}/>{person.name}</button>)}</Card>
        <Card title={thread}><div className="message-list" aria-live="polite">{history.filter(message=>message.person===thread).map(message=><div className={'bubble'+(message.from==='You'?' own':'')} key={message.id}><strong>{message.from}</strong><p>{message.text}</p></div>)}</div>
            <form className="input-row" onSubmit={event=>{event.preventDefault();const form=event.currentTarget;const text=new FormData(form).get('message').trim();if(!text)return;setHistory(items=>[...items,{id:id(),person:thread,from:'You',text}]);form.reset();}}>
                <input name="message" aria-label="Message" placeholder="Write a message" required maxLength={1200}/><button className="primary">Send locally</button>
            </form></Card>
    </div></Page>;
}

export function Inbox() {
    const [letters,setLetters]=useLocal('mail',mail);
    const [folder,setFolder]=useState('Inbox');
    const [active,setActive]=useState('');
    const [compose,setCompose]=useState(false);
    const letter=letters.find(item=>item.id===active&&item.folder===folder);
    const update=(key,change)=>setLetters(items=>items.map(item=>item.id===key?{...item,...change}:item));
    return <Page title="Inbox" description="Demo email stays in this browser." actions={<button className="primary" onClick={()=>setCompose(true)}>Compose</button>}>
        <div className="toolbar">{['Inbox','Sent','Archive'].map(option=><button key={option} aria-pressed={folder===option} onClick={()=>setFolder(option)}>{option}{option==='Inbox'?' ('+letters.filter(item=>item.folder==='Inbox'&&!item.read).length+')':''}</button>)}</div>
        <div className="split-app"><Card title={folder}>
            {letters.filter(item=>item.folder===folder).map(item=><button className="list-button mail-button" key={item.id} aria-pressed={active===item.id} onClick={()=>{setActive(item.id);update(item.id,{read:true});}}><span><strong>{item.subject}</strong><small>{item.from}</small></span>{!item.read&&<Badge>Unread</Badge>}</button>)}
        </Card><Card title={letter?.subject||'Message'}>{letter?<><p>{letter.from}</p><p className="preserve">{letter.body}</p>{folder!=='Sent'&&<button onClick={()=>update(letter.id,{folder:folder==='Archive'?'Inbox':'Archive'})}>{folder==='Archive'?'Restore to inbox':'Archive'}</button>}</>:<Blank title="Open a message" text="Choose a message from this folder."/>}</Card></div>
        {compose&&<Dialog title="Draft email" close={()=>setCompose(false)}><form className="stack" onSubmit={event=>{
            event.preventDefault();
            const data=Object.fromEntries(new FormData(event.currentTarget));
            const key=id();
            setLetters(items=>[{...data,from:data.to,id:key,folder:'Sent',read:true},...items]);setFolder('Sent');setActive(key);setCompose(false);
        }}><Field label="To" name="to" type="email" required/><Field label="Subject" name="subject" required/><Field label="Message"><textarea name="body" rows="6" required/></Field><button className="primary">Save to demo sent folder</button></form></Dialog>}
    </Page>;
}

export function Profile() {
    const [profile,setProfile]=useLocal('profile',people[0]);
    const [notice,setNotice]=useState('');
    return <Page title="Profile"><div className="split-app"><Card><div className="contact-card"><Avatar name={profile.name}/><div><h2>{profile.name}</h2><p>{profile.role}</p></div></div><p>{profile.city}</p></Card>
        <Card title="Personal details"><form className="stack" onSubmit={event=>{event.preventDefault();setProfile(Object.fromEntries(new FormData(event.currentTarget)));setNotice('Profile saved in this browser.');}}>
            {specs.contacts.fields.map(field=><Field key={field.key} label={field.label} type={field.type} name={field.key} defaultValue={profile[field.key]} required/>)}
            <button className="primary">Save profile</button><span role="status">{notice}</span>
        </form></Card></div></Page>;
}
