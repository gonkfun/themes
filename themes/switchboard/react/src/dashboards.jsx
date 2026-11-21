import React,{useState} from 'react';
import {activitySeed,channels,currency,number,orders,products,dateLabel} from './model.js';
import {Card,Page,Plot,Donut,DataTable,Badge} from './ui.jsx';

const metrics=[
    {key:'revenue',label:'Gross revenue',value:currency,tone:'peach'},
    {key:'visits',label:'Visits',value:number,tone:'mint'},
    {key:'orders',label:'Orders',value:number,tone:'lilac'},
    {key:'signups',label:'Signups',value:number,tone:'blue'}
];
const sum=(rows,key)=>rows.reduce((a,row)=>a+row[key],0);
const every=(rows,key,step=4)=>rows.filter((_,i)=>i%step===0).map(row=>row[key]);
const activeOrders=orders.slice(0,5);
export const orderColumns=[
    {key:'id',label:'Order'},{key:'customer',label:'Customer'},{key:'item',label:'Item'},
    {key:'date',label:'Date',render:row=>dateLabel(row.date)},
    {key:'status',label:'Status',render:row=><Badge>{row.status}</Badge>},
    {key:'total',label:'Amount',render:row=>currency(row.total)}
];

function MetricCards({records,comparison}) {
    return <div className="summary-cards">
        {metrics.map(metric=>{
            const current=sum(records,metric.key), previous=sum(comparison,metric.key);
            const delta=previous?Math.round((current-previous)*1000/previous)/10:null;
            return <article key={metric.key} className={'metric '+metric.tone}>
                <p>{metric.label}</p><strong>{metric.value(current)}</strong>
                <div className="metric-foot"><span className={delta<0?'negative':'positive'}>{delta===null?'—':(delta>0?'+':'')+delta+'%'}</span><span>vs prior period</span></div>
                <Plot values={every(records,metric.key,2)} type="line" small/>
            </article>;
        })}
    </div>;
}

export function Overview({commerce=false}) {
    const [range,setRange]=useState(28);
    const records=activitySeed.slice(-range);
    const previous=activitySeed.slice(-range*2,-range);
    const selectedOrders=orders.filter(order=>order.date>=records[0].date);
    const distribution=channels.map(name=>({name,value:selectedOrders.filter(order=>order.channel===name).length}));
    return <Page title={commerce?'Commerce dashboard':'Operations overview'}
        description={commerce?'Orders, inventory, and revenue across the sample storefront.':'Revenue, demand, and the work that needs attention.'}
        actions={<><span className="badge neutral">Sample workspace</span><select aria-label="Reporting period" value={range} onChange={e=>setRange(Number(e.target.value))}><option value="7">7 days</option><option value="14">14 days</option><option value="28">28 days</option><option value="42">42 days</option></select></>}>
        <MetricCards records={records} comparison={previous}/>
        <div className="feature-grid">
            <Card title={commerce?'Order volume':'Demand over time'} subtitle="Current and previous period" className="trend-card"
                action={<span className="trend-legend"><i/> Current <i/> Prior</span>}>
                <Plot values={every(records,commerce?'orders':'visits',1)} second={every(previous,commerce?'orders':'visits',1)} label={'Daily '+(commerce?'orders':'visits')+' over '+range+' days'}/>
                <div className="axis"><span>{dateLabel(records[0].date)}</span><span>{dateLabel(records.at(-1).date)}</span></div>
                <details className="chart-values"><summary>View chart data</summary><dl>{records.map((record,index)=><div key={record.date}><dt>{dateLabel(record.date)}</dt><dd>{commerce?record.orders:record.visits} / {commerce?previous[index]?.orders:previous[index]?.visits}</dd></div>)}</dl></details>
            </Card>
            <section className="feature-art card">
                <img src={import.meta.env.BASE_URL+'art/switchboard-art.webp'} width="768" height="512" alt="" />
                <div><h2>{commerce?'Shop the collection':'The launch queue'}</h2><p>{commerce?'Browse the latest studio inventory.':'Open the board and decide what ships next.'}</p><a href={commerce?'#catalog':'#board'} className="button">{commerce?'View catalogue':'Open Kanban'} ↗</a></div>
            </section>
        </div>
        <div className="secondary-grid">
            <Card title="Order channels" subtitle="Share of orders in this period"><Donut items={distribution}/></Card>
            <Card title={commerce?'Stock watch':'Recent orders'} action={<a href={commerce?'#catalog':'#orders'}>{commerce?'All products':'All orders'} →</a>}>
                {commerce?<ul className="compact-list">{products.filter(product=>product.stock<20).sort((a,b)=>a.stock-b.stock).map(product=><li key={product.id}>
                    <a href={'#/catalog/'+product.id}>{product.name}</a><Badge>{product.stock} remaining</Badge></li>)}</ul>:
                    <ul className="compact-list">{activeOrders.map(order=><li key={order.id}><span><a href={'#/orders/'+order.id}>{order.id} · {order.customer}</a><small>{dateLabel(order.date)}</small></span><span><Badge>{order.status}</Badge> <strong>{currency(order.total)}</strong></span></li>)}</ul>}
            </Card>
            <Card title="Team queue" className="queue-card">
                <ul className="compact-list">
                    <li><a href="#tickets">Support tickets</a><span className="pill">Review</span></li>
                    <li><a href="#calendar">Publishing calendar</a><span className="pill">Plan</span></li>
                    <li><a href="#invoices">Invoice register</a><span className="pill">Open</span></li>
                    <li><a href="#contacts">Contact directory</a><span className="pill">Browse</span></li>
                </ul>
            </Card>
        </div>
    </Page>;
}

export function Charts() {
    const [metric,setMetric]=useState('visits');
    const [days,setDays]=useState(28);
    const values=activitySeed.slice(-days).map(item=>item[metric]/(metric==='revenue'?100:1));
    const one=metric==='revenue'?value=>currency(value*100):number;
    const items=channels.map(name=>({name,value:orders.filter(order=>order.channel===name).length}));
    const total=Math.round(values.reduce((a,b)=>a+b,0));
    const maximum=Math.max(...values);
    return <Page title="Chart gallery" description="Several ways to read the same reporting data." actions={<>
        <select aria-label="Chart metric" value={metric} onChange={e=>setMetric(e.target.value)}>{metrics.map(m=><option key={m.key} value={m.key}>{m.label}</option>)}</select>
        <select aria-label="Chart days" value={days} onChange={e=>setDays(Number(e.target.value))}><option value="7">7 days</option><option value="28">28 days</option><option value="42">42 days</option></select></>}>
        <div className="gallery-grid">
            {['area','line','bars','scatter'].map(type=><Card key={type} title={type==='bars'?'Column chart':type[0].toUpperCase()+type.slice(1)+' chart'} subtitle={one(total)+' total'}>
                <Plot values={values} type={type} label={type+' chart for '+metric}/><details className="chart-values"><summary>View data</summary><p>{values.map(one).join(', ')}</p></details>
            </Card>)}
            <Card title="Donut chart" subtitle="Order count grouped by channel"><Donut items={items}/></Card>
            <Card title="Horizontal bars" subtitle="Order count grouped by channel"><div className="horizontal-bars">{items.map(item=><div key={item.name}><label>{item.name} <strong>{item.value}</strong><progress max={Math.max(...items.map(item=>item.value))} value={item.value}/></label></div>)}</div></Card>
            <Card title="Gauge" subtitle="Latest day as a share of the highest day in view"><div className="gauge"><strong>{Math.round(values.at(-1)/maximum*100)}%</strong><meter min="0" max={maximum} value={values.at(-1)}>{values.at(-1)}</meter></div></Card>
            <Card title="Sparkline" subtitle="Compact line chart for card layouts"><strong className="big-value">{one(values.at(-1))}</strong><Plot values={values} type="line" small label="Sparkline for selected metric"/></Card>
        </div>
    </Page>;
}

export function Tables() {
    const [compact,setCompact]=useState(false);
    const [empty,setEmpty]=useState(false);
    const columns=orderColumns.map(column=>column.key==='id'?{...column,render:row=><a href={'#/orders/'+row.id}>{row.id}</a>}:column);
    return <Page title="Data table examples" description="Sorting, search, row selection, column visibility, detail rows and CSV."
        actions={<><label className="check"><input type="checkbox" checked={compact} onChange={e=>setCompact(e.target.checked)}/> Compact rows</label><label className="check"><input type="checkbox" checked={empty} onChange={e=>setEmpty(e.target.checked)}/> Empty state</label></>}>
        <DataTable rows={empty?[]:orders} columns={columns} title="Example order table" compact={compact}/>
    </Page>;
}
