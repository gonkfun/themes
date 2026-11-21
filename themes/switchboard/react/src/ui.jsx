import React, {useEffect,useRef,useState} from 'react';
import {exportCsv} from './model.js';

export function Page({title,description,children,actions}) {
    return <><header className="page-head"><div><h1>{title}</h1>{description&&<p>{description}</p>}</div>{actions&&<div className="actions">{actions}</div>}</header>{children}</>;
}

export function Card({title,subtitle,action,children,className=''}) {
    return <section className={'card '+className}>
        {(title||action)&&<header className="card-head"><div>{title&&<h2>{title}</h2>}{subtitle&&<p>{subtitle}</p>}</div>{action}</header>}
        {children}
    </section>;
}

export function Badge({children}) {
    const normalized=String(children).toLowerCase();
    const tone=/paid|done|resolved|shipped/.test(normalized)?'mint':/refund|high|overdue/.test(normalized)?'peach':/pending|processing|progress/.test(normalized)?'amber':'lilac';
    return <span className={'badge '+tone}>{children}</span>;
}

export function Avatar({name,color}) {
    return <span className="avatar" aria-hidden="true" style={{'--avatar':color||'#416e7a'}}>{name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('')}</span>;
}

export function Dialog({title,close,children}) {
    const ref=useRef(null);
    useEffect(()=>{
        if (ref.current&&!ref.current.open) ref.current.showModal();
        const dialog=ref.current;
        return ()=>{ if(dialog?.open) dialog.close(); };
    },[]);
    return <dialog ref={ref} aria-label={title} onCancel={event=>{event.preventDefault();close();}}>
        <div className="dialog-head"><h2>{title}</h2><button type="button" className="icon-button" aria-label="Close dialog" onClick={close}>×</button></div>
        {children}
    </dialog>;
}

export function Field({label,children,...attrs}) {
    return <label className="field"><span>{label}</span>{children||<input {...attrs}/>}</label>;
}

export function Blank({title='Nothing to show',text='Try a different filter.'}) {
    return <div className="blank"><strong>{title}</strong><p>{text}</p></div>;
}

export function DataTable({rows,columns,title='Records',filename='switchboard-records.csv',onEdit,compact=false}) {
    const [search,setSearch]=useState('');
    const [order,setOrder]=useState({column:0,ascending:true,enabled:false});
    const [page,setPage]=useState(1);
    const [size,setSize]=useState(8);
    const [selection,setSelection]=useState(new Set());
    const [hidden,setHidden]=useState(new Set());
    const [expanded,setExpanded]=useState(null);
    const [columnOrder,setColumnOrder]=useState(()=>columns.map(column=>column.key));
    const draggedColumn=useRef(null);
    const get=(row,column)=>column.value?column.value(row):row[column.key];
    const select=(id,checked)=>setSelection(current=>{const next=new Set(current);checked?next.add(id):next.delete(id);return next;});
    const ordered=columnOrder.map(key=>columns.findIndex(column=>column.key===key));
    const shown=ordered.filter(i=>i>=0&&!hidden.has(columns[i].key)).map(i=>({...columns[i],i}));
    function moveColumn(source,target) {
        if(!source||source===target) return;
        setColumnOrder(previous=>{
            const next=[...previous];
            const from=next.indexOf(source), to=next.indexOf(target);
            if(from<0||to<0) return previous;
            next.splice(from,1);
            next.splice(to,0,source);
            return next;
        });
    }
    const filtered=rows.filter(row=>columns.some(column=>String(get(row,column)??'').toLowerCase().includes(search.trim().toLowerCase())));
    if(order.enabled) {
        const column=columns[order.column];
        filtered.sort((a,b)=>{
            const left=get(a,column), right=get(b,column);
            const result=typeof left==='number' && typeof right==='number'?left-right:String(left??'').localeCompare(String(right??''));
            return order.ascending?result:-result;
        });
    }
    const count=Math.max(1,Math.ceil(filtered.length/size));
    const current=Math.min(page,count);
    const pageRows=filtered.slice((current-1)*size,current*size);
    const chosen=rows.filter(row=>selection.has(row.id));
    const download=()=>{
        const selected=chosen.length?chosen:filtered;
        exportCsv(filename,[shown.map(column=>column.label),...selected.map(row=>shown.map(column=>get(row,column)))]);
    };
    function sort(index){
        setOrder(prev=>({column:index,ascending:prev.column===index&&prev.enabled?!prev.ascending:true,enabled:true}));
        setPage(1);
    }
    return <Card title={title} className="table-card" action={<button type="button" onClick={download} disabled={!filtered.length&&!chosen.length}>Export CSV</button>}>
        <div className="table-tools">
            <input aria-label="Filter records" placeholder="Filter records…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
            <details className="column-menu"><summary>Columns</summary><div>{ordered.map((index,position)=>{
                const column=columns[index];
                return <div className="column-option" key={column.key}>
                    <label><input type="checkbox" disabled={shown.length===1&&!hidden.has(column.key)} checked={!hidden.has(column.key)} onChange={()=>{
                        setHidden(prev=>{const next=new Set(prev);next.has(column.key)?next.delete(column.key):next.add(column.key);return next;});
                    }}/>{column.label}</label>
                    <button type="button" aria-label={'Move '+column.label+' earlier'} disabled={position===0} onClick={()=>moveColumn(column.key,columns[ordered[position-1]].key)}>↑</button>
                    <button type="button" aria-label={'Move '+column.label+' later'} disabled={position===ordered.length-1} onClick={()=>moveColumn(column.key,columns[ordered[position+1]].key)}>↓</button>
                </div>;
            })}</div></details>
            <span className="muted" role="status">{filtered.length} records{chosen.length?' · '+chosen.length+' selected':''}</span>
        </div>
        {pageRows.length?<div className={'table-scroll '+(compact?'table-compact':'')} tabIndex={0} aria-label={title+' scroll area'}>
            <table><thead><tr><th scope="col"><span className="sr">Select</span></th>
                {shown.map(column=><th key={column.key} scope="col" draggable title="Drag to reorder. Use Columns for keyboard controls."
                    onDragStart={event=>{draggedColumn.current=column.key;event.dataTransfer.setData('text/plain',column.key);}}
                    onDragEnd={()=>{draggedColumn.current=null;}}
                    onDragOver={event=>{if(draggedColumn.current)event.preventDefault();}}
                    onDrop={event=>{event.preventDefault();moveColumn(draggedColumn.current,column.key);}}
                    aria-sort={order.enabled&&order.column===column.i?(order.ascending?'ascending':'descending'):undefined}>
                    <button type="button" className="table-sort" onClick={()=>sort(column.i)}>{column.label} {order.enabled&&order.column===column.i?(order.ascending?'↑':'↓'):'↕'}</button>
                </th>)}<th scope="col">Actions</th></tr></thead>
                <tbody>{pageRows.map(row=><React.Fragment key={row.id}><tr>
                    <td><input type="checkbox" aria-label={`Select ${row.id}`} checked={selection.has(row.id)} onChange={e=>select(row.id,e.target.checked)}/></td>
                    {shown.map(column=><td key={column.key}>{column.render?column.render(row):get(row,column)}</td>)}
                    <td className="row-actions"><button type="button" aria-expanded={expanded===row.id} onClick={()=>setExpanded(expanded===row.id?null:row.id)}>Details</button>{onEdit&&<button type="button" onClick={()=>onEdit(row)}>Edit</button>}</td>
                </tr>{expanded===row.id&&<tr className="details-row"><td colSpan={shown.length+2}>
                    <dl>{columns.map(column=><div key={column.key}><dt>{column.label}</dt><dd>{String(get(row,column)??'—')}</dd></div>)}</dl>
                </td></tr>}</React.Fragment>)}</tbody>
            </table>
        </div>:<Blank/>}
        <div className="pagination">
            <label>Rows <select aria-label="Rows per page" value={size} onChange={e=>{setSize(Number(e.target.value));setPage(1);}}>
                {[5,8,12,24].map(value=><option key={value}>{value}</option>)}
            </select></label>
            <div><button type="button" disabled={current===1} onClick={()=>setPage(current-1)}>Previous</button> <span>Page {current} of {count}</span> <button type="button" disabled={current>=count} onClick={()=>setPage(current+1)}>Next</button></div>
        </div>
    </Card>;
}

export function Plot({values,second=[],type='area',label,small=false}) {
    const ref=useRef(null);
    const seriesKey=values.join(',')+';'+second.join(',');
    useEffect(()=>{
        const canvas=ref.current;
        const ctx=canvas.getContext('2d');
        if(!ctx) return;
        function paint(){
            const w=canvas.clientWidth,h=canvas.clientHeight;
            if(!w||!h)return;
            const ratio=Math.min(devicePixelRatio||1,2);
            canvas.width=w*ratio;canvas.height=h*ratio;
            ctx.scale(ratio,ratio);
            const color=getComputedStyle(canvas);
            const ink=color.getPropertyValue('--accent').trim()||'#32745d';
            const other=color.getPropertyValue('--chart-secondary').trim()||'#7254c2';
            const rule=color.getPropertyValue('--line').trim()||'#ddd';
            const maximum=Math.max(1,...values,...second);
            const margin=small?2:13;
            const baseline=h-margin;
            const valueY=value=>baseline-(h-margin*2)*value/maximum;
            if(!small){
                ctx.strokeStyle=rule;ctx.lineWidth=1;
                for(let line=0;line<=4;line++){
                    const y=margin+(h-margin*2)*line/4;
                    ctx.beginPath();ctx.moveTo(margin,y);ctx.lineTo(w-margin,y);ctx.stroke();
                }
            }
            function draw(sequence,stroke){
                if(!sequence.length)return;
                const width=w-margin*2;
                const space=width/Math.max(1,sequence.length-1);
                if(type==='bars') {
                    const slot=width/sequence.length, bar=Math.min(21,slot*.66);
                    ctx.fillStyle=stroke;
                    sequence.forEach((val,i)=>ctx.fillRect(margin+i*slot+(slot-bar)/2,valueY(val),bar,baseline-valueY(val)));
                    return;
                }
                if(type==='scatter') {
                    ctx.fillStyle=stroke;
                    sequence.forEach((val,i)=>{ctx.beginPath();ctx.arc(margin+space*i,valueY(val),small?2:4,0,Math.PI*2);ctx.fill();});
                    return;
                }
                const path = new Path2D();
                sequence.forEach((val,i)=>{if(i===0) path.moveTo(margin,valueY(val));else path.lineTo(margin+space*i,valueY(val));});
                if(type==='area'){
                    const plane=new Path2D(path);plane.lineTo(margin+space*(sequence.length-1),baseline);plane.lineTo(margin,baseline);plane.closePath();
                    const wash=ctx.createLinearGradient(0,margin,0,baseline);wash.addColorStop(0,stroke);wash.addColorStop(1,'transparent');
                    ctx.save();ctx.globalAlpha=.23;ctx.fillStyle=wash;ctx.fill(plane);ctx.restore();
                }
                ctx.strokeStyle=stroke;ctx.lineWidth=small?2:2.5;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke(path);
            }
            draw(second,other);draw(values,ink);
        }
        const observer=new ResizeObserver(paint);observer.observe(canvas);
        const mode=new MutationObserver(paint);mode.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-accent']});
        paint();
        return ()=>{observer.disconnect();mode.disconnect();};
    },[seriesKey,small,type]);
    return <canvas className={small?'spark':'plot'} ref={ref} role={label?'img':undefined} aria-label={label} aria-hidden={label?undefined:true}/>;
}

export function Donut({items,label='Breakdown'}) {
    const totals=items.reduce((sum,item)=>sum+item.value,0);
    let start=0;
    const colors=['var(--accent)','var(--chart-secondary)','#d17a57','#8e9f4a','#62a7b9'];
    const stops=items.map((item,index)=>{
        const left=start;start+=totals?item.value/totals*100:0;
        return `${colors[index%colors.length]} ${left}% ${start}%`;
    });
    return <div className="donut-layout" aria-label={label}>
        <div className="donut" aria-hidden="true" style={{'--segments':stops.join(', ')||'var(--line)'}}><strong>{totals.toLocaleString()}</strong></div>
        <ul className="legend">{items.map((item,i)=><li key={item.name}><span><span className="legend-dot" style={{'--dot':colors[i%colors.length]}}/>{item.name}</span><strong>{item.value.toLocaleString()}</strong></li>)}</ul>
    </div>;
}
